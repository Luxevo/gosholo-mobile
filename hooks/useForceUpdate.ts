import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface ForceUpdateState {
  needsUpdate: boolean;
  isChecking: boolean;
  message: string;
  storeUrl: string;
}

const APP_STORE_URL = 'https://apps.apple.com/app/gosholo/id6749919037';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gosholo.gosholo';

function compareVersions(current: string, minimum: string): boolean {
  const currentParts = current.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const minimumPart = minimumParts[i] || 0;

    if (currentPart < minimumPart) return true;
    if (currentPart > minimumPart) return false;
  }

  return false;
}

export function useForceUpdate(language: string = 'en'): ForceUpdateState {
  const [state, setState] = useState<ForceUpdateState>({
    needsUpdate: false,
    isChecking: true,
    message: '',
    storeUrl: Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL,
  });

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const currentVersion = Constants.expoConfig?.version || '0.0.0';
        const platform = Platform.OS;

        const { data, error } = await supabase
          .from('app_config')
          .select('key, value')
          .in('key', [
            'force_update_enabled',
            platform === 'ios' ? 'min_ios_version' : 'min_android_version',
            language === 'fr' ? 'update_message_fr' : 'update_message_en',
          ]);

        if (error) {
          console.error('Error checking app config:', error);
          setState((prev) => ({ ...prev, isChecking: false }));
          return;
        }

        const config = data?.reduce(
          (acc, item) => {
            acc[item.key] = item.value;
            return acc;
          },
          {} as Record<string, string>
        );

        const forceEnabled = config?.force_update_enabled === 'true';
        const minVersion =
          config?.[platform === 'ios' ? 'min_ios_version' : 'min_android_version'] || '0.0.0';
        const message =
          config?.[language === 'fr' ? 'update_message_fr' : 'update_message_en'] ||
          'Please update the app to continue.';

        const needsUpdate = forceEnabled && compareVersions(currentVersion, minVersion);

        setState({
          needsUpdate,
          isChecking: false,
          message,
          storeUrl: platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL,
        });
      } catch (err) {
        console.error('Error in force update check:', err);
        setState((prev) => ({ ...prev, isChecking: false }));
      }
    };

    checkForUpdate();
  }, [language]);

  return state;
}
