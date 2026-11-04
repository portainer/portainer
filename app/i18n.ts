import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import { baseHref } from '@/portainer/helpers/pathHelper';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    backend: {
      // resolve against the base href so --base-url deployments load
      // /<base-url>/locales/... instead of /locales/...
      loadPath: () => `${baseHref()}locales/{{lng}}/{{ns}}.json`,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
