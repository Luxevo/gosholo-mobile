import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

type LikeType = 'offer' | 'event' | 'commerce';

interface LikeIds {
  offers: Set<string>;
  events: Set<string>;
  commerces: Set<string>;
}

export const useLikes = () => {
  const [likes, setLikes] = useState<LikeIds>({
    offers: new Set(),
    events: new Set(),
    commerces: new Set(),
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch all likes for the current user
  const fetchLikes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLikes({ offers: new Set(), events: new Set(), commerces: new Set() });
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch all likes in parallel
      const [offersRes, eventsRes, commercesRes] = await Promise.all([
        supabase.from('user_likes_offers').select('offer_id').eq('user_id', user.id),
        supabase.from('user_likes_events').select('event_id').eq('user_id', user.id),
        supabase.from('user_likes_commerces').select('commerce_id').eq('user_id', user.id),
      ]);

      setLikes({
        offers: new Set(offersRes.data?.map(l => l.offer_id) || []),
        events: new Set(eventsRes.data?.map(l => l.event_id) || []),
        commerces: new Set(commercesRes.data?.map(l => l.commerce_id) || []),
      });
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if an item is liked
  const isLiked = useCallback((type: LikeType, id: string): boolean => {
    switch (type) {
      case 'offer':
        return likes.offers.has(id);
      case 'event':
        return likes.events.has(id);
      case 'commerce':
        return likes.commerces.has(id);
      default:
        return false;
    }
  }, [likes]);

  // Toggle like (add if not liked, remove if liked)
  const toggleLike = useCallback(async (type: LikeType, id: string): Promise<{ success: boolean; needsLogin: boolean; action?: 'liked' | 'unliked' }> => {
    // Check if user is logged in
    if (!userId) {
      return { success: false, needsLogin: true };
    }

    const tableName = `user_likes_${type}s` as const;
    const idColumn = `${type}_id` as const;
    const isCurrentlyLiked = isLiked(type, id);

    try {
      if (isCurrentlyLiked) {
        // Remove like
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', userId)
          .eq(idColumn, id);

        if (error) throw error;

        // Update local state
        setLikes(prev => {
          const newSet = new Set(prev[`${type}s` as keyof LikeIds]);
          newSet.delete(id);
          return { ...prev, [`${type}s`]: newSet };
        });

        return { success: true, needsLogin: false, action: 'unliked' };
      } else {
        // Add like
        const { error } = await supabase
          .from(tableName)
          .insert({ user_id: userId, [idColumn]: id });

        if (error) throw error;

        // Update local state
        setLikes(prev => {
          const newSet = new Set(prev[`${type}s` as keyof LikeIds]);
          newSet.add(id);
          return { ...prev, [`${type}s`]: newSet };
        });

        return { success: true, needsLogin: false, action: 'liked' };
      }
    } catch (error) {
      console.error(`Error toggling ${type} like:`, error);
      return { success: false, needsLogin: false };
    }
  }, [userId, isLiked]);

  // Listen for auth changes
  useEffect(() => {
    fetchLikes();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchLikes();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchLikes]);

  return {
    likes,
    loading,
    isLoggedIn: !!userId,
    isLiked,
    toggleLike,
    refetch: fetchLikes,
  };
};
