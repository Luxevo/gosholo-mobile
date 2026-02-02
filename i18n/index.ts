import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en/common.json';
import fr from '../locales/fr/common.json';

export const LANGUAGE_STORAGE_KEY = '@gosholo_language';

// Get device language (e.g., "en", "fr", "es")
const deviceLanguage = getLocales()[0]?.languageCode || 'fr';

// Use device language if we support it, otherwise default to French
const supportedLanguages = ['en', 'fr'];
const initialLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'fr';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: initialLanguage,
    fallbackLng: 'fr',
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    interpolation: { escapeValue: false },
  });

// Load saved language preference (call this on app startup)
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

export default i18n;


