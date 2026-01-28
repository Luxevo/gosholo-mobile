import { useLikesContext } from '@/contexts/LikesContext';

export type LikeType = 'offer' | 'event' | 'commerce';

// Re-export the hook from context for backward compatibility
export const useLikes = () => {
  return useLikesContext();
};
