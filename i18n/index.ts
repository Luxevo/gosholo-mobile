import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en/common.json';
import fr from '../locales/fr/common.json';

i18n
  .use(initReactI18next)
  .init({
    lng: 'fr', // Default to French
    fallbackLng: 'en',
    resources: {
      en: { common: en },
      fr: { common: fr },
    },
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;


