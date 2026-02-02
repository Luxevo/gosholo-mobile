import { supabase, type Event } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

export type EventWithCommerce = Event & {
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

interface UseEventsOptions {
  searchQuery?: string;
  filterType?: 'all' | 'nearby' | 'this_week' | 'upcoming';
  userLocation?: [number, number] | null;
  radius?: number; // in km
}

// Module-level cache for events data
let eventsCache: EventWithCommerce[] | null = null;
let eventsCacheListeners: Set<(events: EventWithCommerce[]) => void> = new Set();

const notifyEventsListeners = (events: EventWithCommerce[]) => {
  eventsCache = events;
  eventsCacheListeners.forEach(listener => listener(events));
};

export const useEvents = (options: UseEventsOptions = {}) => {
  const [events, setEvents] = useState<EventWithCommerce[]>(eventsCache || []);
  const [loading, setLoading] = useState(eventsCache === null);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery = '',
    filterType = 'all',
    userLocation,
    radius = 10
  } = options;

  // Subscribe to cache updates
  useEffect(() => {
    const listener = (newEvents: EventWithCommerce[]) => {
      setEvents(newEvents);
      setLoading(false);
    };
    eventsCacheListeners.add(listener);
    return () => {
      eventsCacheListeners.delete(listener);
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      // Only show loading if no cached data
      if (!eventsCache) {
        setLoading(true);
      }
      setError(null);

      // Get all active events that haven't expired - RLS policy handles security
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      let eventsQuery = supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .or(`end_date.is.null,end_date.gt.${today}`) // Include events with no end_date or end_date > today
        .order('boosted', { ascending: false }) // Boosted events first
        .order('start_date', { ascending: true }); // Upcoming events first

      // Apply search filter if provided
      if (searchQuery.trim()) {
        eventsQuery = eventsQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: eventsData, error: eventsError } = await eventsQuery;

      if (eventsError) {
        throw eventsError;
      }

      if (!eventsData || eventsData.length === 0) {
        notifyEventsListeners([]);
        return;
      }

      // Get unique commerce IDs
      const commerceIds = [...new Set(eventsData.map(event => event.commerce_id))];

      // Fetch commerce data with category
      const { data: commercesData, error: commercesError } = await supabase
        .from('commerces')
        .select('id, name, address, latitude, longitude, category_id, category:category_id(name_en, name_fr)')
        .in('id', commerceIds);

      if (commercesError) {
        throw commercesError;
      }

      // Combine events with commerce data and calculate distance
      const combinedData = eventsData.map(event => {
        const commerce = commercesData?.find(c => c.id === event.commerce_id) || null;

        // Calculate distance if user location is available
        let distance: number | null = null;
        if (userLocation && userLocation[0] && userLocation[1]) {
          const eventLat = event.latitude || commerce?.latitude;
          const eventLng = event.longitude || commerce?.longitude;

          if (eventLat && eventLng) {
            distance = calculateDistance(
              userLocation[1], // user lat
              userLocation[0], // user lng
              parseFloat(eventLat.toString()),
              parseFloat(eventLng.toString())
            );
          }
        }

        return {
          ...event,
          commerces: commerce,
          distance
        };
      });

      let filteredData = combinedData;

      // Apply date filters
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (filterType === 'this_week') {
        filteredData = filteredData.filter(event => {
          const startDate = new Date(event.start_date);
          return startDate <= oneWeekFromNow;
        });
      } else if (filterType === 'upcoming') {
        filteredData = filteredData.filter(event => {
          const startDate = new Date(event.start_date);
          return startDate > now;
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

      notifyEventsListeners(filteredData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, searchQuery, filterType]);

  const refetch = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch
  };
};

// Helper function to calculate distance between two points (Haversine formula)
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
