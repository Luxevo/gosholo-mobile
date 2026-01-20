import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

type FavoriteType = 'offer' | 'event' | 'commerce';

interface FavoriteIds {
  offers: Set<string>;
  events: Set<string>;
  commerces: Set<string>;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteIds>({
    offers: new Set(),
    events: new Set(),
    commerces: new Set(),
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch all favorites for the current user
  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setFavorites({ offers: new Set(), events: new Set(), commerces: new Set() });
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch all favorites in parallel
      const [offersRes, eventsRes, commercesRes] = await Promise.all([
        supabase.from('user_favorite_offers').select('offer_id').eq('user_id', user.id),
        supabase.from('user_favorite_events').select('event_id').eq('user_id', user.id),
        supabase.from('user_favorite_commerces').select('commerce_id').eq('user_id', user.id),
      ]);

      setFavorites({
        offers: new Set(offersRes.data?.map(f => f.offer_id) || []),
        events: new Set(eventsRes.data?.map(f => f.event_id) || []),
        commerces: new Set(commercesRes.data?.map(f => f.commerce_id) || []),
      });
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if an item is favorited
  const isFavorite = useCallback((type: FavoriteType, id: string): boolean => {
    switch (type) {
      case 'offer':
        return favorites.offers.has(id);
      case 'event':
        return favorites.events.has(id);
      case 'commerce':
        return favorites.commerces.has(id);
      default:
        return false;
    }
  }, [favorites]);

  // Toggle favorite (add if not favorited, remove if favorited)
  const toggleFavorite = useCallback(async (type: FavoriteType, id: string): Promise<{ success: boolean; needsLogin: boolean; action?: 'added' | 'removed' }> => {
    // Check if user is logged in
    if (!userId) {
      return { success: false, needsLogin: true };
    }

    const tableName = `user_favorite_${type}s` as const;
    const idColumn = `${type}_id` as const;
    const isCurrentlyFavorite = isFavorite(type, id);

    try {
      if (isCurrentlyFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', userId)
          .eq(idColumn, id);

        if (error) throw error;

        // Update local state
        setFavorites(prev => {
          const newSet = new Set(prev[`${type}s` as keyof FavoriteIds]);
          newSet.delete(id);
          return { ...prev, [`${type}s`]: newSet };
        });

        return { success: true, needsLogin: false, action: 'removed' };
      } else {
        // Add favorite
        const { error } = await supabase
          .from(tableName)
          .insert({ user_id: userId, [idColumn]: id });

        if (error) throw error;

        // Update local state
        setFavorites(prev => {
          const newSet = new Set(prev[`${type}s` as keyof FavoriteIds]);
          newSet.add(id);
          return { ...prev, [`${type}s`]: newSet };
        });

        return { success: true, needsLogin: false, action: 'added' };
      }
    } catch (error) {
      console.error(`Error toggling ${type} favorite:`, error);
      return { success: false, needsLogin: false };
    }
  }, [userId, isFavorite]);

  // Listen for auth changes
  useEffect(() => {
    fetchFavorites();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchFavorites();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    isLoggedIn: !!userId,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
};
