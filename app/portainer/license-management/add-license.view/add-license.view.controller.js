export default class AddLicenseViewController {
  /* @ngInject */
  constructor($async, $state, LicenseService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.LicenseService = LicenseService;
    this.Notifications = Notifications;

    this.licenses = [''];
    this.keyValidations = {};

    this.onSubmitSuccess = this.onSubmitSuccess.bind(this);
  }

  onSubmitSuccess() {
    this.$state.go('portainer.licenses');
  }
}
