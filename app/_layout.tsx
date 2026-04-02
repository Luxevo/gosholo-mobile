// app/_layout.tsx - Root layout
import ForceUpdateModal from '@/components/ForceUpdateModal';
import WelcomeModal from '@/components/WelcomeModal';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { FollowsProvider } from '@/contexts/FollowsContext';
import { LikesProvider } from '@/contexts/LikesContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { useForceUpdate } from '@/hooks/useForceUpdate';
import { useOneSignal } from '@/hooks/useOneSignal';
import i18n, { loadSavedLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { I18nextProvider, useTranslation } from 'react-i18next';

const WELCOME_MODAL_KEY = '@gosholo_welcome_seen';

function RootLayoutContent() {
  const { i18n: i18nInstance } = useTranslation();
  const { needsUpdate, isChecking, message, storeUrl } = useForceUpdate(i18nInstance.language);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Initialize OneSignal push notifications
  useOneSignal();

  // Handle deep links for auth callbacks and content sharing
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async (url: string, isColdStart = false) => {
      if (handledUrlRef.current === url) return;
      handledUrlRef.current = url;
      // Reset after 2s so the same link can be scanned again later
      setTimeout(() => { handledUrlRef.current = null; }, 2000);
      console.log('Deep link received:', url);

      // Check if this is an auth callback
      if (url.includes('auth/callback') || url.includes('access_token') || url.includes('refresh_token')) {
        try {
          // Extract tokens from URL (Supabase sends them as hash fragments)
          const hashParams = url.split('#')[1];
          if (hashParams) {
            const params = new URLSearchParams(hashParams);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const type = params.get('type');

            if (accessToken && refreshToken) {
              // Set the session with the tokens
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (!error) {
                // Check if this is a password recovery flow
                if (type === 'recovery') {
                  // Navigate to reset password screen
                  router.replace('/(auth)/reset-password');
                  return;
                }
                // Successfully authenticated, navigate to main app
                router.replace('/(tabs)');
                return;
              }
            }
          }
        } catch (err) {
          console.error('Error handling auth callback:', err);
        }
        return;
      }

      // Handle offer deep links
      // Formats: gosholomobile://offer/[id] or https://app.gosholo.com/offer-mobile/[id]
      const offerMatch = url.match(/\/offer(?:-mobile)?\/([a-zA-Z0-9-]+)/);
      if (offerMatch) {
        const offerId = offerMatch[1];
        await AsyncStorage.setItem('@gosholo_deep_link', JSON.stringify({ type: 'offer', id: offerId }));
        if (!isColdStart) router.replace('/(tabs)/offers');
        return;
      }

      // Handle event deep links
      // Formats: gosholomobile://event/[id] or https://app.gosholo.com/event-mobile/[id]
      const eventMatch = url.match(/\/event(?:-mobile)?\/([a-zA-Z0-9-]+)/);
      if (eventMatch) {
        const eventId = eventMatch[1];
        await AsyncStorage.setItem('@gosholo_deep_link', JSON.stringify({ type: 'event', id: eventId }));
        if (!isColdStart) router.replace('/(tabs)/events');
        return;
      }

      // Handle commerce deep links
      // Formats: gosholomobile://commerce/[id] or https://app.gosholo.com/commerce-mobile/[id]
      const commerceMatch = url.match(/\/commerce(?:-mobile)?\/([a-zA-Z0-9-]+)/);
      if (commerceMatch) {
        const commerceId = commerceMatch[1];
        await AsyncStorage.setItem('@gosholo_deep_link', JSON.stringify({ type: 'commerce', id: commerceId }));
        if (!isColdStart) router.replace('/(tabs)/compass');
        return;
      }
    };

    // Handle initial URL (cold start) — save to AsyncStorage, navigate directly to the tab.
    Linking.getInitialURL().then(async (url) => {
      if (url) {
        await handleDeepLink(url, true);
        const deepLinkData = await AsyncStorage.getItem('@gosholo_deep_link');
        if (deepLinkData) {
          const { type } = JSON.parse(deepLinkData);
          if (type === 'commerce') { router.replace('/(tabs)/compass'); return; }
          if (type === 'offer') { router.replace('/(tabs)/offers'); return; }
          if (type === 'event') { router.replace('/(tabs)/events'); return; }
        }
        router.replace('/');
      }
    });

    // Handle URL changes while app is open (warm start) — navigate immediately
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url, false);
    });

    return () => subscription.remove();
  }, []);

  // Show welcome modal only if user hasn't seen it before
  useEffect(() => {
    const checkWelcomeModal = async () => {
      try {
        const hasSeenWelcome = await AsyncStorage.getItem(WELCOME_MODAL_KEY);
        if (!hasSeenWelcome) {
          // Show modal after a short delay to ensure app is loaded
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking welcome modal:', error);
      }
    };

    checkWelcomeModal();
  }, []);

  // Check for OTA updates on launch and when app comes to foreground
  useEffect(() => {
    if (__DEV__) return;

    const checkForOTAUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('OTA update check failed:', e);
      }
    };

    checkForOTAUpdate();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkForOTAUpdate();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleCloseWelcomeModal = async (dontShowAgain: boolean) => {
    try {
      if (dontShowAgain) {
        await AsyncStorage.setItem(WELCOME_MODAL_KEY, 'true');
      }
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Error saving welcome modal state:', error);
      setShowWelcomeModal(false);
    }
  };

  return (
    <LocationProvider>
      <FavoritesProvider>
        <LikesProvider>
          <FollowsProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 400,
              }}
            />
            <WelcomeModal
              visible={showWelcomeModal && !needsUpdate && !isChecking}
              onClose={handleCloseWelcomeModal}
            />
            <ForceUpdateModal
              visible={needsUpdate}
              message={message}
              storeUrl={storeUrl}
            />
          </FollowsProvider>
        </LikesProvider>
      </FavoritesProvider>
    </LocationProvider>
  );
}

export default function RootLayout() {
  // Load saved language preference on app startup
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <RootLayoutContent />
    </I18nextProvider>
  );
}