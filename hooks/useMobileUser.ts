import { supabase, type UserProfile } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// Module-level cache to share profile data across components
let profileCache: UserProfile | null = null;
let cacheListeners: Set<(profile: UserProfile | null) => void> = new Set();

const notifyListeners = (profile: UserProfile | null) => {
  profileCache = profile;
  cacheListeners.forEach(listener => listener(profile));
};

export const useProfile = () => {
  // Initialize with cached data if available
  const [profile, setProfile] = useState<UserProfile | null>(profileCache);
  const [loading, setLoading] = useState(profileCache === null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to cache updates
  useEffect(() => {
    const listener = (newProfile: UserProfile | null) => {
      setProfile(newProfile);
      setLoading(false);
    };
    cacheListeners.add(listener);
    return () => {
      cacheListeners.delete(listener);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      // Only show loading if we don't have cached data
      if (!profileCache) {
        setLoading(true);
      }
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        notifyListeners(null);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      notifyListeners(profileData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatesWithTimestamp)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message || 'Failed to update profile');
      }

      // Update cache and notify all listeners
      notifyListeners(data);
      return data;
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          notifyListeners(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refetch = () => {
    fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch
  };
};

// Legacy alias for backwards compatibility
export const useMobileUser = useProfile;
