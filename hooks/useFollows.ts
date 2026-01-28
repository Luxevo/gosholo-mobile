import { useFollowsContext } from '@/contexts/FollowsContext';

// Re-export the hook from context for backward compatibility
export const useFollows = () => {
  return useFollowsContext();
};
