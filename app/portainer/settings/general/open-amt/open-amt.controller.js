class OpenAmtController {
  /* @ngInject */
  constructor($async, $state, OpenAMTService, Notifications) {
    Object.assign(this, { $async, $state, OpenAMTService, Notifications });

    this.cert = null;
    this.originalValues = {
      enableOpenAMT: false,
      certFile: null,
      certPassword: '',
      domainName: '',
      useWirelessConfig: false,
      wifiAuthenticationMethod: '4',
      wifiEncryptionMethod: '3',
      wifiSsid: '',
      wifiPskPass: '',
    };

    this.formValues = {
      enableOpenAMT: false,
      certFile: null,
      certPassword: '',
      domainName: '',
      useWirelessConfig: false,
      wifiAuthenticationMethod: '4',
      wifiEncryptionMethod: '3',
      wifiSsid: '',
      wifiPskPass: '',
    };

    this.state = {
      showForm: false,
      actionInProgress: false,
      reloadingPage: false,
    };

    this.save = this.save.bind(this);
  }

  isFormChanged() {
    return Object.entries(this.originalValues).some(([key, value]) => value !== this.formValues[key]);
  }

  async save() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        this.formValues.certFileText = this.formValues.certFile ? await this.formValues.certFile.text() : null;
        await this.OpenAMTService.submit(this.formValues);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.Notifications.success('OpenAMT successfully updated');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed applying changes');
      }
      this.state.actionInProgress = false;
    });
  }
}

export default OpenAmtController;
