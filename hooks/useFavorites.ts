import { useFavoritesContext } from '@/contexts/FavoritesContext';

export type FavoriteType = 'offer' | 'event' | 'commerce';

// Re-export the hook from context for backward compatibility
export const useFavorites = () => {
  return useFavoritesContext();
};
