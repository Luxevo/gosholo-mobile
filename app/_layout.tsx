// app/_layout.tsx - Root layout
import ForceUpdateModal from '@/components/ForceUpdateModal';
import WelcomeModal from '@/components/WelcomeModal';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { FollowsProvider } from '@/contexts/FollowsContext';
import { LikesProvider } from '@/contexts/LikesContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { useForceUpdate } from '@/hooks/useForceUpdate';
import i18n, { loadSavedLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

const WELCOME_MODAL_KEY = '@gosholo_welcome_seen';

function RootLayoutContent() {
  const { i18n: i18nInstance } = useTranslation();
  const { needsUpdate, isChecking, message, storeUrl } = useForceUpdate(i18nInstance.language);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Handle deep links for auth callbacks and content sharing
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
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
        router.replace('/(tabs)/offers');
        return;
      }

      // Handle event deep links
      // Formats: gosholomobile://event/[id] or https://app.gosholo.com/event-mobile/[id]
      const eventMatch = url.match(/\/event(?:-mobile)?\/([a-zA-Z0-9-]+)/);
      if (eventMatch) {
        const eventId = eventMatch[1];
        await AsyncStorage.setItem('@gosholo_deep_link', JSON.stringify({ type: 'event', id: eventId }));
        router.replace('/(tabs)/events');
        return;
      }
    };

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URL changes while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
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

  // Don't render app content while checking for updates
  if (isChecking) {
    return null;
  }

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
              visible={showWelcomeModal && !needsUpdate}
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