import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export interface Ad {
  id: string;
  image_url: string;
  link_url: string | null;
  active_from: string;
  active_to: string;
}

export function useAd() {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    supabase
      .from('ads')
      .select('id, image_url, link_url, active_from, active_to')
      .eq('is_active', true)
      .lte('active_from', today)
      .gte('active_to', today)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setAd(data);
      });
  }, []);

  return ad;
}
