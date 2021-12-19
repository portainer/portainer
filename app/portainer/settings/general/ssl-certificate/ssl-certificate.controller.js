class SslCertificateController {
  /* @ngInject */
  constructor($async, $scope, $state, SSLService, Notifications) {
    Object.assign(this, { $async, $scope, $state, SSLService, Notifications });

    this.cert = null;
    this.originalValues = {
      forceHTTPS: false,
      certFile: null,
      keyFile: null,
    };

    this.formValues = {
      certFile: null,
      keyFile: null,
      forceHTTPS: false,
    };

    this.state = {
      actionInProgress: false,
      reloadingPage: false,
    };

    const pemPattern = '.pem';
    this.certFilePattern = `${pemPattern},.crt,.cer,.cert`;
    this.keyFilePattern = `${pemPattern},.key`;

    this.save = this.save.bind(this);
    this.onChangeForceHTTPS = this.onChangeForceHTTPS.bind(this);
  }

  isFormChanged() {
    return Object.entries(this.originalValues).some(([key, value]) => value != this.formValues[key]);
  }

  onChangeForceHTTPS(checked) {
    return this.$scope.$evalAsync(() => {
      this.formValues.forceHTTPS = checked;
    });
  }

  async save() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        const cert = this.formValues.certFile ? await this.formValues.certFile.text() : null;
        const key = this.formValues.keyFile ? await this.formValues.keyFile.text() : null;
        const httpEnabled = !this.formValues.forceHTTPS;
        await this.SSLService.upload(httpEnabled, cert, key);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        location.reload();
        this.state.reloadingPage = true;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed applying changes');
      }
      this.state.actionInProgress = false;
    });
  }

  wasHTTPsChanged() {
    return this.originalValues.forceHTTPS !== this.formValues.forceHTTPS;
  }

  async $onInit() {
    return this.$async(async () => {
      try {
        const certInfo = await this.SSLService.get();

        this.formValues.forceHTTPS = !certInfo.httpEnabled;
        this.originalValues.forceHTTPS = this.formValues.forceHTTPS;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading certificate info');
      }
    });
  }
}

export default SslCertificateController;
