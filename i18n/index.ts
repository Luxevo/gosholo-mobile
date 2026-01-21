import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from '../locales/en/common.json';
import fr from '../locales/fr/common.json';

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

export default i18n;


