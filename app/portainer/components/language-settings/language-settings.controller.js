class LanguageSettingsController {
  /* @ngInject */
  constructor(LocalStorage, $window, $i18next) {
    this.LocalStorage = LocalStorage;
    this.$window = $window;
    this.i18n = $i18next;

    this.state = {
      selectedLanguage: LocalStorage.get('i18nextLng') || 'en',
    };

    this.changeLanguage = this.changeLanguage.bind(this);
  }

  changeLanguage() {
    this.LocalStorage.set('i18nextLng', this.state.selectedLanguage);
    this.i18n.changeLanguage(this.state.selectedLanguage).then(() => {
      this.$window.location.reload();
    });
  }
}

export default LanguageSettingsController;
angular.module('portainer.app').controller('LanguageSettingsController', LanguageSettingsController);
