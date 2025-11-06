import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Commerce {
  id: string;
  name: string;
  address: string;
  category_id: number | null;
  category?: {
    name_en: string;
    name_fr: string;
  };
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  postal_code: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  boosted: boolean | null;
  boosted_at: string | null;
  boost_type: 'en_vedette' | 'visibilite' | null;
}

export function useCommerces() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommerces();
  }, []);

  const fetchCommerces = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏪 Fetching commerces...');

      const { data, error: supabaseError } = await supabase
        .from('commerces')
        .select('*, category:category_id(name_en, name_fr)')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('boosted', { ascending: false })
        .order('boosted_at', { ascending: false, nullsFirst: false });

      console.log('🏪 Supabase response:', { data, error: supabaseError });

      if (supabaseError) {
        throw supabaseError;
      }

      console.log(`🏪 Found ${data?.length || 0} commerces`);
      setCommerces(data || []);
    } catch (err) {
      console.error('🏪 Error fetching commerces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch commerces');
    } finally {
      setLoading(false);
    }
  };

  return {
    commerces,
    loading,
    error,
    refetch: fetchCommerces,
  };
}