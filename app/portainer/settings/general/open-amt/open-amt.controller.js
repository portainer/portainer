class OpenAmtController {
  /* @ngInject */
  constructor($async, $state, OpenAMTService, SettingsService, Notifications) {
    Object.assign(this, { $async, $state, OpenAMTService, SettingsService, Notifications });

    this.originalValues = {};
    this.formValues = {
      enableOpenAMT: false,
      mpsServer: '',
      mpsUser: '',
      mpsPassword: '',
      domainName: '',
      certFile: null,
      certPassword: '',
      useWirelessConfig: false,
      wifiAuthenticationMethod: '4',
      wifiEncryptionMethod: '3',
      wifiSsid: '',
      wifiPskPass: '',
    };

    this.originalValues = {
      ...this.formValues,
    };

    this.state = {
      actionInProgress: false,
    };

    this.save = this.save.bind(this);
  }

  isFormChanged() {
    return Object.entries(this.originalValues).some(([key, value]) => value !== this.formValues[key]);
  }

  isFormValid() {
    return !this.formValues.enableOpenAMT || this.formValues.certFile != null;
  }

  async readFile() {
    return new Promise((resolve, reject) => {
      const file = this.formValues.certFile;
      if (file) {
        const fileReader = new FileReader();
        fileReader.fileName = file.name;
        fileReader.onload = (e) => {
          const base64 = e.target.result;
          // remove prefix of "data:application/x-pkcs12;base64," returned by "readAsDataURL()"
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
        this.Notifications.success(`OpenAMT successfully ${this.formValues.enableOpenAMT ? 'enabled' : 'disabled'}`);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed applying changes');
      }
      this.state.actionInProgress = false;
    });
  }

  async $onInit() {
    return this.$async(async () => {
      try {
        const data = await this.SettingsService.settings();
        const config = data.OpenAMTConfiguration;

        if (config) {
          this.formValues = {
            ...this.formValues,
            enableOpenAMT: config.Enabled,
            mpsServer: config.MPSServer,
            mpsUser: config.Credentials.MPSUser,
            domainName: config.DomainConfiguration.DomainName,
          };

          if (config.WirelessConfiguration) {
            this.formValues.useWirelessConfig = true;
            this.formValues.wifiAuthenticationMethod = config.WirelessConfiguration.AuthenticationMethod;
            this.formValues.wifiEncryptionMethod = config.WirelessConfiguration.EncryptionMethod;
            this.formValues.wifiSsid = config.WirelessConfiguration.SSID;
          }

          this.originalValues = {
            ...this.formValues,
          };
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading settings');
      }
    });
  }
}

export default OpenAmtController;
