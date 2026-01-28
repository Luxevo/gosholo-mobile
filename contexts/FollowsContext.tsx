import { supabase } from '@/lib/supabase';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

interface FollowsContextValue {
  follows: Set<string>;
  loading: boolean;
  isLoggedIn: boolean;
  isFollowing: (commerceId: string) => boolean;
  toggleFollow: (commerceId: string) => Promise<{ success: boolean; needsLogin: boolean; action?: 'followed' | 'unfollowed' }>;
  refetch: () => Promise<void>;
}

const FollowsContext = createContext<FollowsContextValue | null>(null);

export const FollowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchFollows = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setFollows(new Set());
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_follows_commerces')
        .select('commerce_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFollows(new Set(data?.map(f => f.commerce_id) || []));
    } catch (error) {
      console.error('Error fetching follows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isFollowing = useCallback((commerceId: string): boolean => {
    return follows.has(commerceId);
  }, [follows]);

  const toggleFollow = useCallback(async (commerceId: string): Promise<{ success: boolean; needsLogin: boolean; action?: 'followed' | 'unfollowed' }> => {
    if (!userId) {
      return { success: false, needsLogin: true };
    }

    const isCurrentlyFollowing = isFollowing(commerceId);

    // Optimistic update
    setFollows(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyFollowing) {
        newSet.delete(commerceId);
      } else {
        newSet.add(commerceId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('user_follows_commerces')
          .delete()
          .eq('user_id', userId)
          .eq('commerce_id', commerceId);

        if (error) throw error;

        // Update follower_count
        await supabase.rpc('decrement_follower_count', { item_id: commerceId });

        return { success: true, needsLogin: false, action: 'unfollowed' };
      } else {
        const { error } = await supabase
          .from('user_follows_commerces')
          .insert({ user_id: userId, commerce_id: commerceId });

        if (error) throw error;

        // Update follower_count
        await supabase.rpc('increment_follower_count', { item_id: commerceId });

        return { success: true, needsLogin: false, action: 'followed' };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Rollback
      setFollows(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.add(commerceId);
        } else {
          newSet.delete(commerceId);
        }
        return newSet;
      });
      return { success: false, needsLogin: false };
    }
  }, [userId, isFollowing]);

  useEffect(() => {
    fetchFollows();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          fetchFollows();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchFollows]);

  const value = useMemo(() => ({
    follows,
    loading,
    isLoggedIn: !!userId,
    isFollowing,
    toggleFollow,
    refetch: fetchFollows,
  }), [follows, loading, userId, isFollowing, toggleFollow, fetchFollows]);

  return (
    <FollowsContext.Provider value={value}>
      {children}
    </FollowsContext.Provider>
  );
};

export const useFollowsContext = (): FollowsContextValue => {
  const context = useContext(FollowsContext);
  if (!context) {
    throw new Error('useFollowsContext must be used within a FollowsProvider');
  }
  return context;
};
