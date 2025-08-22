import { useState, useEffect } from 'react';
import { supabase, type Offer } from '@/lib/supabase';

export type OfferWithCommerce = Offer & {
  commerces: {
    id: string;
    name: string;
    category: string;
    address: string;
    latitude?: number;
    longitude?: number;
  } | null;
};

interface UseOffersOptions {
  searchQuery?: string;
  filterType?: 'all' | 'nearby' | 'online' | 'in_store';
  userLocation?: [number, number] | null;
  radius?: number; // in km
}

export const useOffers = (options: UseOffersOptions = {}) => {
  const [offers, setOffers] = useState<OfferWithCommerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery = '',
    filterType = 'all',
    userLocation,
    radius = 10
  } = options;

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all active offers - RLS policy handles security
      let offersQuery = supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('boosted', { ascending: false }) // Boosted offers first
        .order('created_at', { ascending: false });

      // Apply search filter if provided
      if (searchQuery.trim()) {
        offersQuery = offersQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: offersData, error: offersError } = await offersQuery;

      console.log('Offers query result:', { offersData, offersError });

      if (offersError) {
        throw offersError;
      }

      if (!offersData || offersData.length === 0) {
        setOffers([]);
        return;
      }

      // Get unique commerce IDs
      const commerceIds = [...new Set(offersData.map(offer => offer.commerce_id))];

      // Fetch commerce data
      const { data: commercesData, error: commercesError } = await supabase
        .from('commerces')
        .select('id, name, category, address, latitude, longitude')
        .in('id', commerceIds);

      if (commercesError) {
        throw commercesError;
      }

      // Combine offers with commerce data
      const combinedData = offersData.map(offer => ({
        ...offer,
        commerces: commercesData?.find(commerce => commerce.id === offer.commerce_id) || null
      }));

      console.log('Combined offers data:', combinedData);

      let filteredData = combinedData;

      // Apply location filter if user location is provided
      if (filterType === 'nearby' && userLocation && userLocation[0] && userLocation[1]) {
        filteredData = filteredData.filter(offer => {
          // Use offer location if available, otherwise use commerce location
          const offerLat = offer.latitude || offer.commerces?.latitude;
          const offerLng = offer.longitude || offer.commerces?.longitude;
          
          if (!offerLat || !offerLng) return false;

          // Simple distance calculation (Haversine formula approximation)
          const distance = calculateDistance(
            userLocation[1], // user lat
            userLocation[0], // user lng
            parseFloat(offerLat.toString()),
            parseFloat(offerLng.toString())
          );

          return distance <= radius;
        });
      }

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