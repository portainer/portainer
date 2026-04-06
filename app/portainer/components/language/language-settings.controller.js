import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import i18n from '@/i18n';

const languageOptions = [
  {
    id: 'en',
    label: 'English',
    value: 'en',
  },
  {
    id: 'ko',
    label: '한국어',
    value: 'ko',
  },
];

export default class LanguageSettingsController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;
    this.setLanguage = this.setLanguage.bind(this);
  }

  async setLanguage(language) {
    return this.$async(async () => {
      try {
        await i18n.changeLanguage(language);
        this.state.language = language;
        localStorage.setItem('i18nextLng', language);
        notifySuccess(
          i18n.t('language_settings.success'),
          i18n.t('language_settings.language_updated')
        );
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        notifyError(
          i18n.t('common.failure'),
          err,
          i18n.t('language_settings.unable_update_language')
        );
      }
    });
  }

  $onInit() {
    this.state = {
      language: i18n.language || 'en',
      availableLanguages: languageOptions,
    };
  }
}
