import _ from 'lodash-es';

export default class LicensesFormController {
  /* @ngInject */
  constructor($async, LicenseService, Notifications) {
    this.$async = $async;
    this.LicenseService = LicenseService;
    this.Notifications = Notifications;

    this.state = {
      actionInProgress: false,
      formError: '',
    };
    this.keyValidations = {};

    this.addLicense = this.addLicense.bind(this);
    this.removeLicense = this.removeLicense.bind(this);
    this.onLicenseChange = this.onLicenseChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  addLicense() {
    this.licenses.push('');
  }

  removeLicense(index) {
    this.licenses.splice(index, 1);
  }

  onLicenseChange(value, index) {
    this.licenses[index] = value;
  }

  isFormValid() {
    return this.form.$valid && this.licenses.every((key) => !this.keyValidations[key] || this.keyValidations[key].status);
  }

  async submit() {
    if (!this.isFormValid()) {
      this.state.formError = 'Form is invalid';
      return;
    }
    let licenses = _.compact(this.licenses);

    if (!licenses.length) {
      this.state.formError = 'At least one license should be provided';
      return;
    }

    licenses = licenses.filter((key) => !this.keyValidations[key] || !this.keyValidations[key].status);

    if (!licenses.length) {
      this.onSubmitSuccess();
      return;
    }

    try {
      const { failedKeys } = await this.LicenseService.attach(licenses);

      if (failedKeys && Object.keys(failedKeys).length) {
        this.keyValidations = Object.fromEntries(licenses.map((key) => [key, { status: !failedKeys[key], message: failedKeys[key] }]));
        return;
      }

      this.onSubmitSuccess();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Failed validating licenses');
    }
  }
}
