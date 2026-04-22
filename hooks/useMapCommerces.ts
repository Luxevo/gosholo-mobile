import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Commerce } from './useCommerces';

// Module-level cache for map commerces data (separate from general commerces cache)
let mapCommercesCache: Commerce[] | null = null;
let mapCommercesCacheListeners: Set<(commerces: Commerce[]) => void> = new Set();

const notifyMapCommercesListeners = (commerces: Commerce[]) => {
  mapCommercesCache = commerces;
  mapCommercesCacheListeners.forEach(listener => listener(commerces));
};

export const fetchMapCommercesData = async (): Promise<Commerce[]> => {
  const { data, error } = await supabase
    .from('commerces_map_visible')
    .select('*, category:category_id(name_en, name_fr), sub_category(name_en, name_fr)')
    .eq('status', 'active')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const commerces = data || [];
  notifyMapCommercesListeners(commerces);
  return commerces;
};

export function useMapCommerces() {
  const [commerces, setCommerces] = useState<Commerce[]>(mapCommercesCache || []);
  const [loading, setLoading] = useState(mapCommercesCache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener = (newCommerces: Commerce[]) => {
      setCommerces(newCommerces);
      setLoading(false);
    };
    mapCommercesCacheListeners.add(listener);
    return () => {
      mapCommercesCacheListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (mapCommercesCache) return;
    fetchMapCommerces();
  }, []);

  const fetchMapCommerces = async () => {
    try {
      if (!mapCommercesCache) {
        setLoading(true);
      }
      setError(null);
      console.log('🗺️ Fetching map commerces...');

      const data = await fetchMapCommercesData();
      console.log(`🗺️ Found ${data.length} map-visible commerces`);
    } catch (err) {
      console.error('🗺️ Error fetching map commerces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch map commerces');
    } finally {
      setLoading(false);
    }
  };

  return {
    commerces,
    loading,
    error,
    refetch: fetchMapCommerces,
  };
}
