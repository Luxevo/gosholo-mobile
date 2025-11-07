import { supabase, type Event } from '@/lib/supabase';
import { useEffect, useState } from 'react';

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
        setEvents([]);
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

