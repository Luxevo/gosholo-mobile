import { fetchCommercesData } from '@/hooks/useCommerces';
import { notifyEventsListeners } from '@/hooks/useEvents';
import { notifyOffersListeners } from '@/hooks/useOffers';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';

async function fetchOffersPrefetch() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('offers')
      .select('*, commerces:commerce_id(id, name, address, latitude, longitude, category_id, category:category_id(name_en, name_fr))')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gt.${today}`)
      .order('boosted', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function fetchEventsPrefetch() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('events')
      .select('*, commerces:commerce_id(id, name, address, latitude, longitude, category_id, category:category_id(name_en, name_fr))')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gt.${today}`)
      .order('boosted', { ascending: false })
      .order('start_date', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

// Prefetch all app data in parallel during splash screen
export async function prefetchAppData() {
  try {
    const [commerces, offersData, eventsData] = await Promise.all([
      fetchCommercesData().catch(() => []),
      fetchOffersPrefetch(),
      fetchEventsPrefetch(),
    ]);

    // Populate module-level caches so hooks skip their initial fetch
    if (offersData.length > 0) {
      notifyOffersListeners(offersData as any);
    }
    if (eventsData.length > 0) {
      notifyEventsListeners(eventsData as any);
    }

    // Prefetch business images in background
    const imageUrls = [
      ...commerces.map((c: any) => c.image_url),
      ...offersData.map((o: any) => o.image_url),
      ...eventsData.map((e: any) => e.image_url),
    ].filter((url): url is string => !!url);

    const uniqueImages = [...new Set(imageUrls)];
    if (uniqueImages.length > 0) {
      Image.prefetch(uniqueImages).catch(() => {});
    }

    console.log(`📦 Prefetched: ${commerces.length} commerces, ${offersData.length} offers, ${eventsData.length} events, ${uniqueImages.length} images`);
  } catch (err) {
    console.log('Prefetch failed (non-blocking):', err);
  }
}
