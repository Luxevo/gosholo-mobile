import { AdBanner } from '@/components/AdBanner';
import { useAd } from '@/hooks/useAd';
import { supabase } from '@/lib/supabase';
import { prefetchAppData } from '@/utils/prefetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';

export default function Index() {
  const router = useRouter();
  const ad = useAd('splash');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start prefetching data immediately
    prefetchAppData();

    // Start animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    let navigated = false;

    // Check auth state and navigate
    const checkAuthAndNavigate = async () => {
      if (navigated) return;
      navigated = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Check if there's a deep link — navigate to the right tab
          const deepLinkData = await AsyncStorage.getItem('@gosholo_deep_link');
          if (deepLinkData) {
            const { type } = JSON.parse(deepLinkData);
            if (type === 'offer') { router.replace('/(tabs)/offers'); return; }
            if (type === 'event') { router.replace('/(tabs)/events'); return; }
            if (type === 'commerce') { router.replace('/(tabs)/compass'); return; }
          }
          router.replace('/(tabs)/ai');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/(auth)/login');
      }
    };

    // Check if app was opened via a deep link (cold start).
    // If so, _layout.tsx's deep link handler will navigate — we skip.
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('auth/callback') || url.includes('access_token'))) {
        // Auth deep link — _layout.tsx handles navigation
        navigated = true;
        return;
      }

      // No auth deep link — navigate after animation completes
      setTimeout(checkAuthAndNavigate, 2000);
    });

    // Also listen for deep links arriving while splash is visible (warm start)
    const linkSub = Linking.addEventListener('url', (event) => {
      if (event.url.includes('auth/callback') || event.url.includes('access_token')) {
        navigated = true;
      }
    });

    return () => linkSub.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/darker-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      {ad && (
        <View style={styles.adContainer}>
          <AdBanner ad={ad} variant="splash" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  adContainer: {
    position: 'absolute',
    bottom: 48,
  },
});