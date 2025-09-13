import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook to get safe area padding values optimized for Android navigation bars
 * and iOS safe areas
 */
export function useSafeAreaPadding() {
  const insets = useSafeAreaInsets();

  return {
    // Top padding (status bar + notch area)
    paddingTop: insets.top,
    
    // Bottom padding (home indicator + navigation bar)
    paddingBottom: Platform.OS === 'android' 
      ? Math.max(insets.bottom, 16) // Ensure minimum 16px on Android
      : insets.bottom,
    
    // Left and right padding (notches, rounded corners)
    paddingLeft: insets.left,
    paddingRight: insets.right,
    
    // Raw insets for custom usage
    insets,
    
    // Convenience methods
    getTabBarPadding: () => Platform.OS === 'android' 
      ? Math.max(insets.bottom, 16) 
      : 16,
      
    getContentPadding: () => ({
      paddingTop: insets.top,
      paddingBottom: Platform.OS === 'android' 
        ? Math.max(insets.bottom, 16) 
        : insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
  };
}
