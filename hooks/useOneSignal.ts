import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { OneSignal, LogLevel } from 'react-native-onesignal';

// Replace with your OneSignal App ID from the OneSignal dashboard
const ONESIGNAL_APP_ID = 'b9317076-af6a-473d-a82c-1607b547e985';

export function useOneSignal() {
  useEffect(() => {
    // Initialize OneSignal
    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }

    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request push notification permission (iOS will show the system prompt)
    OneSignal.Notifications.requestPermission(true);

    // Link OneSignal player to Supabase user
    const linkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        OneSignal.login(user.id);
      }
    };

    linkUser();

    // Listen for auth changes to keep OneSignal in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          OneSignal.login(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          OneSignal.logout();
        }
      }
    );

    // Handle notification opened (user tapped on it)
    const handleClick = (event: any) => {
      const data = event.notification.additionalData as Record<string, string> | undefined;
      if (!data) return;

      const { router } = require('expo-router');

      if (data.type === 'offer' && data.offerId) {
        router.push(`/(tabs)/offers`);
      } else if (data.type === 'event' && data.eventId) {
        router.push(`/(tabs)/events`);
      } else if (data.type === 'commerce' && data.commerceId) {
        router.push(`/(tabs)/compass`);
      }
    };

    OneSignal.Notifications.addEventListener('click', handleClick);

    return () => {
      subscription.unsubscribe();
      OneSignal.Notifications.removeEventListener('click', handleClick);
    };
  }, []);
}
