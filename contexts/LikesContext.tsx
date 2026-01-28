import { supabase } from '@/lib/supabase';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type LikeType = 'offer' | 'event' | 'commerce';

interface LikeIds {
  offers: Set<string>;
  events: Set<string>;
  commerces: Set<string>;
}

interface LikeCounts {
  offers: Map<string, number>;
  events: Map<string, number>;
  commerces: Map<string, number>;
}

interface LikesContextValue {
  likes: LikeIds;
  likeCounts: LikeCounts;
  loading: boolean;
  isLoggedIn: boolean;
  isLiked: (type: LikeType, id: string) => boolean;
  getLikeCount: (type: LikeType, id: string) => number;
  toggleLike: (type: LikeType, id: string) => Promise<{ success: boolean; needsLogin: boolean; action?: 'liked' | 'unliked' }>;
  setLikeCount: (type: LikeType, id: string, count: number) => void;
  refetch: () => Promise<void>;
}

const LikesContext = createContext<LikesContextValue | null>(null);

export const LikesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likes, setLikes] = useState<LikeIds>({
    offers: new Set(),
    events: new Set(),
    commerces: new Set(),
  });
  const [likeCounts, setLikeCounts] = useState<LikeCounts>({
    offers: new Map(),
    events: new Map(),
    commerces: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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

  const getLikeCount = useCallback((type: LikeType, id: string): number => {
    const key = `${type}s` as keyof LikeCounts;
    return likeCounts[key].get(id) || 0;
  }, [likeCounts]);

  const setLikeCount = useCallback((type: LikeType, id: string, count: number) => {
    setLikeCounts(prev => {
      const key = `${type}s` as keyof LikeCounts;
      const newMap = new Map(prev[key]);
      newMap.set(id, count);
      return { ...prev, [key]: newMap };
    });
  }, []);

  const toggleLike = useCallback(async (type: LikeType, id: string): Promise<{ success: boolean; needsLogin: boolean; action?: 'liked' | 'unliked' }> => {
    if (!userId) {
      return { success: false, needsLogin: true };
    }

    const tableName = `user_likes_${type}s` as const;
    const idColumn = `${type}_id` as const;
    const countTable = `${type}s` as const;
    const isCurrentlyLiked = isLiked(type, id);

    // Optimistic update - update UI immediately
    setLikes(prev => {
      const key = `${type}s` as keyof LikeIds;
      const newSet = new Set(prev[key]);
      if (isCurrentlyLiked) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, [key]: newSet };
    });

    // Optimistic update for like count
    setLikeCounts(prev => {
      const key = `${type}s` as keyof LikeCounts;
      const newMap = new Map(prev[key]);
      const currentCount = newMap.get(id) || 0;
      newMap.set(id, isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1);
      return { ...prev, [key]: newMap };
    });

    try {
      if (isCurrentlyLiked) {
        // Remove like
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', userId)
          .eq(idColumn, id);

        if (error) throw error;

        // Decrement like_count in the main table
        await supabase.rpc('decrement_like_count', {
          table_name: countTable,
          item_id: id
        });

        return { success: true, needsLogin: false, action: 'unliked' };
      } else {
        // Add like
        const { error } = await supabase
          .from(tableName)
          .insert({ user_id: userId, [idColumn]: id });

        if (error) throw error;

        // Increment like_count in the main table
        await supabase.rpc('increment_like_count', {
          table_name: countTable,
          item_id: id
        });

        return { success: true, needsLogin: false, action: 'liked' };
      }
    } catch (error) {
      console.error(`Error toggling ${type} like:`, error);
      // Rollback on error
      setLikes(prev => {
        const key = `${type}s` as keyof LikeIds;
        const newSet = new Set(prev[key]);
        if (isCurrentlyLiked) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return { ...prev, [key]: newSet };
      });
      // Rollback like count
      setLikeCounts(prev => {
        const key = `${type}s` as keyof LikeCounts;
        const newMap = new Map(prev[key]);
        const currentCount = newMap.get(id) || 0;
        newMap.set(id, isCurrentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1));
        return { ...prev, [key]: newMap };
      });
      return { success: false, needsLogin: false };
    }
  }, [userId, isLiked]);

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

  const value = useMemo(() => ({
    likes,
    likeCounts,
    loading,
    isLoggedIn: !!userId,
    isLiked,
    getLikeCount,
    toggleLike,
    setLikeCount,
    refetch: fetchLikes,
  }), [likes, likeCounts, loading, userId, isLiked, getLikeCount, toggleLike, setLikeCount, fetchLikes]);

  return (
    <LikesContext.Provider value={value}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikesContext = (): LikesContextValue => {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikesContext must be used within a LikesProvider');
  }
  return context;
};
