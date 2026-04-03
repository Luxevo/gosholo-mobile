import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type FavoriteType = 'offer' | 'event' | 'commerce';

interface FavoriteIds {
  offers: Set<string>;
  events: Set<string>;
  commerces: Set<string>;
}

interface FavoritesContextValue {
  favorites: FavoriteIds;
  loading: boolean;
  isLoggedIn: boolean;
  isFavorite: (type: FavoriteType, id: string) => boolean;
  toggleFavorite: (type: FavoriteType, id: string) => Promise<{ success: boolean; needsLogin: boolean; action?: 'added' | 'removed' }>;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteIds>({
    offers: new Set(),
    events: new Set(),
    commerces: new Set(),
  });
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites({ offers: new Set(), events: new Set(), commerces: new Set() });
      setLoading(false);
      return;
    }

    try {
      const [offersRes, eventsRes, commercesRes] = await Promise.all([
        supabase.from('user_favorite_offers').select('offer_id').eq('user_id', userId),
        supabase.from('user_favorite_events').select('event_id').eq('user_id', userId),
        supabase.from('user_favorite_commerces').select('commerce_id').eq('user_id', userId),
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
  }, [userId]);

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

  const toggleFavorite = useCallback(async (type: FavoriteType, id: string): Promise<{ success: boolean; needsLogin: boolean; action?: 'added' | 'removed' }> => {
    if (!userId) {
      return { success: false, needsLogin: true };
    }

    const tableName = `user_favorite_${type}s` as const;
    const idColumn = `${type}_id` as const;
    const isCurrentlyFavorite = isFavorite(type, id);

    // Optimistic update - update UI immediately
    setFavorites(prev => {
      const key = `${type}s` as keyof FavoriteIds;
      const newSet = new Set(prev[key]);
      if (isCurrentlyFavorite) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, [key]: newSet };
    });

    try {
      if (isCurrentlyFavorite) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', userId)
          .eq(idColumn, id);

        if (error) throw error;
        return { success: true, needsLogin: false, action: 'removed' };
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert({ user_id: userId, [idColumn]: id });

        if (error) throw error;
        return { success: true, needsLogin: false, action: 'added' };
      }
    } catch (error) {
      console.error(`Error toggling ${type} favorite:`, error);
      // Rollback on error
      setFavorites(prev => {
        const key = `${type}s` as keyof FavoriteIds;
        const newSet = new Set(prev[key]);
        if (isCurrentlyFavorite) {
          newSet.add(id); // Re-add if we were trying to remove
        } else {
          newSet.delete(id); // Remove if we were trying to add
        }
        return { ...prev, [key]: newSet };
      });
      return { success: false, needsLogin: false };
    }
  }, [userId, isFavorite]);

  // Re-fetch when user changes (sign in / sign out)
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const value = useMemo(() => ({
    favorites,
    loading,
    isLoggedIn: !!userId,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  }), [favorites, loading, userId, isFavorite, toggleFavorite, fetchFavorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};
