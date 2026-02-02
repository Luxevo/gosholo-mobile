import { supabase, type Offer } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

export type OfferWithCommerce = Offer & {
  commerces: {
    id: string;
    name: string;
    category_id: number | null;
    category: {
      name_en: string;
      name_fr: string;
    } | null;
    address: string;
    latitude?: number;
    longitude?: number;
  } | null;
  distance?: number | null;
  like_count?: number;
};

interface UseOffersOptions {
  searchQuery?: string;
  filterType?: 'all' | 'nearby' | 'online' | 'in_store';
  userLocation?: [number, number] | null;
  radius?: number; // in km
}

// Module-level cache for offers data
let offersCache: OfferWithCommerce[] | null = null;
let offersCacheListeners: Set<(offers: OfferWithCommerce[]) => void> = new Set();

const notifyOffersListeners = (offers: OfferWithCommerce[]) => {
  offersCache = offers;
  offersCacheListeners.forEach(listener => listener(offers));
};

export const useOffers = (options: UseOffersOptions = {}) => {
  const [offers, setOffers] = useState<OfferWithCommerce[]>(offersCache || []);
  const [loading, setLoading] = useState(offersCache === null);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery = '',
    filterType = 'all',
    userLocation,
    radius = 10
  } = options;

  // Subscribe to cache updates
  useEffect(() => {
    const listener = (newOffers: OfferWithCommerce[]) => {
      setOffers(newOffers);
      setLoading(false);
    };
    offersCacheListeners.add(listener);
    return () => {
      offersCacheListeners.delete(listener);
    };
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      // Only show loading if no cached data
      if (!offersCache) {
        setLoading(true);
      }
      setError(null);

      // Get all active offers that haven't expired - RLS policy handles security
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      let offersQuery = supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .or(`end_date.is.null,end_date.gt.${today}`) // Include offers with no end_date or end_date > today
        .order('boosted', { ascending: false }) // Boosted offers first
        .order('created_at', { ascending: false });

      // Apply search filter if provided
      if (searchQuery.trim()) {
        offersQuery = offersQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: offersData, error: offersError } = await offersQuery;


      if (offersError) {
        throw offersError;
      }

      if (!offersData || offersData.length === 0) {
        setOffers([]);
        return;
      }

      // Get unique commerce IDs
      const commerceIds = [...new Set(offersData.map(offer => offer.commerce_id))];

      // Fetch commerce data with category
      const { data: commercesData, error: commercesError } = await supabase
        .from('commerces')
        .select('id, name, address, latitude, longitude, category_id, category:category_id(name_en, name_fr)')
        .in('id', commerceIds);

      if (commercesError) {
        throw commercesError;
      }

      // Combine offers with commerce data and calculate distance
      const combinedData = offersData.map(offer => {
        const commerce = commercesData?.find(c => c.id === offer.commerce_id) || null;

        // Calculate distance if user location is available
        let distance: number | null = null;
        if (userLocation && userLocation[0] && userLocation[1]) {
          const offerLat = offer.latitude || commerce?.latitude;
          const offerLng = offer.longitude || commerce?.longitude;

          if (offerLat && offerLng) {
            distance = calculateDistance(
              userLocation[1], // user lat
              userLocation[0], // user lng
              parseFloat(offerLat.toString()),
              parseFloat(offerLng.toString())
            );
          }
        }

        return {
          ...offer,
          commerces: commerce,
          distance
        };
      });

      let filteredData = combinedData;

      // Apply location filter if user location is provided
      if (filterType === 'nearby' && userLocation && userLocation[0] && userLocation[1]) {
        filteredData = filteredData.filter(offer => {
          if (offer.distance === null) return false;
          return offer.distance <= radius;
        });
      }

      // Sort by boosted first, then by distance (closest to farthest)
      filteredData.sort((a, b) => {
        // Boosted items first
        if (a.boosted && !b.boosted) return -1;
        if (!a.boosted && b.boosted) return 1;

        // Then sort by distance (closest first)
        // Items without distance go to the end
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      setOffers(filteredData);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [searchQuery, filterType, userLocation]);

  const refetch = () => {
    fetchOffers();
  };

  return {
    offers,
    loading,
    error,
    refetch
  };
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};