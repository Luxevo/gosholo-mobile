import { supabase, type Event } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export type EventWithCommerce = Event & {
  commerces: {
    id: string;
    name: string;
    category: string;
    address: string;
    latitude?: number;
    longitude?: number;
  } | null;
};

interface UseEventsOptions {
  searchQuery?: string;
  filterType?: 'all' | 'nearby' | 'this_week' | 'upcoming';
  userLocation?: [number, number] | null;
  radius?: number; // in km
}

export const useEvents = (options: UseEventsOptions = {}) => {
  const [events, setEvents] = useState<EventWithCommerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searchQuery = '',
    filterType = 'all',
    userLocation,
    radius = 10
  } = options;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all active events - RLS policy handles security
      let eventsQuery = supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
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
        setEvents([]);
        return;
      }

      // Get unique commerce IDs
      const commerceIds = [...new Set(eventsData.map(event => event.commerce_id))];

      // Fetch commerce data
      const { data: commercesData, error: commercesError } = await supabase
        .from('commerces')
        .select('id, name, category, address, latitude, longitude')
        .in('id', commerceIds);

      if (commercesError) {
        throw commercesError;
      }

      // Combine events with commerce data
      const combinedData = eventsData.map(event => ({
        ...event,
        commerces: commercesData?.find(commerce => commerce.id === event.commerce_id) || null
      }));

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

      setEvents(filteredData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, filterType, userLocation]);

  const refetch = () => {
    fetchEvents();
  };

  return {
    events,
    loading,
    error,
    refetch
  };
};

