import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

export const useFollows = () => {
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch all follows for the current user
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

  // Check if a commerce is followed
  const isFollowing = useCallback((commerceId: string): boolean => {
    return follows.has(commerceId);
  }, [follows]);

  // Toggle follow (add if not following, remove if following)
  const toggleFollow = useCallback(async (commerceId: string): Promise<{ success: boolean; needsLogin: boolean; action?: 'followed' | 'unfollowed' }> => {
    // Check if user is logged in
    if (!userId) {
      return { success: false, needsLogin: true };
    }

    const isCurrentlyFollowing = isFollowing(commerceId);

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows_commerces')
          .delete()
          .eq('user_id', userId)
          .eq('commerce_id', commerceId);

        if (error) throw error;

        // Update local state
        setFollows(prev => {
          const newSet = new Set(prev);
          newSet.delete(commerceId);
          return newSet;
        });

        return { success: true, needsLogin: false, action: 'unfollowed' };
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows_commerces')
          .insert({ user_id: userId, commerce_id: commerceId });

        if (error) throw error;

        // Update local state
        setFollows(prev => {
          const newSet = new Set(prev);
          newSet.add(commerceId);
          return newSet;
        });

        return { success: true, needsLogin: false, action: 'followed' };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      return { success: false, needsLogin: false };
    }
  }, [userId, isFollowing]);

  // Listen for auth changes
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

  return {
    follows,
    loading,
    isLoggedIn: !!userId,
    isFollowing,
    toggleFollow,
    refetch: fetchFollows,
  };
};
