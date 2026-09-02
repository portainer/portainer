import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'htmlTag', 'path', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
