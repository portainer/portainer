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

  async readFile() {
    return new Promise((resolve, reject) => {
      const file = this.formValues.certFile;
      if (file) {
        const fileReader = new FileReader();
        fileReader.fileName = file.name;
        fileReader.onload = (e) => {
          const base64 = e.target.result;
          const index = base64.indexOf('base64,');
          const cert = base64.substring(index + 7, base64.length);
          resolve(cert);
        };
        fileReader.onerror = () => {
          reject(new Error('error reading provisioning certificate file'));
        };
        fileReader.readAsDataURL(file);
      }
    });
  }

  async save() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        this.formValues.certFileText = this.formValues.certFile ? await this.readFile(this.formValues.certFile) : null;
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
