class OpenAmtController {
  /* @ngInject */
  constructor($async, $scope, $state, OpenAMTService, SettingsService, Notifications) {
    Object.assign(this, { $async, $scope, $state, OpenAMTService, SettingsService, Notifications });

    this.originalValues = {};
    this.formValues = {
      enableOpenAMT: false,
      mpsServer: '',
      mpsUser: '',
      mpsPassword: '',
      domainName: '',
      certFile: null,
      certFileText: '',
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
    this.onChangeEnableOpenAMT = this.onChangeEnableOpenAMT.bind(this);
  }

  onChangeEnableOpenAMT(checked) {
    return this.$scope.$evalAsync(() => {
      this.formValues.enableOpenAMT = checked;
    });
  }

  isFormChanged() {
    return Object.entries(this.originalValues).some(([key, value]) => value !== this.formValues[key]);
  }

  isFormValid() {
    if (!this.formValues.enableOpenAMT) {
      return true;
    }
    return this.formValues.certFile != null || this.formValues.certFileText !== '';
  }

  onCertFileSelected(file) {
    return this.$scope.$evalAsync(async () => {
      if (file) {
        this.formValues.certFileText = '';
      }
    });
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
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
    });
  }

  async save() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        if (this.formValues.certFile) {
          this.formValues.certFileText = await this.readFile(this.formValues.certFile);
        }
        await this.OpenAMTService.submit(this.formValues);

        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.Notifications.success(`OpenAMT successfully ${this.formValues.enableOpenAMT ? 'enabled' : 'disabled'}`);
        this.originalValues = {
          ...this.formValues,
        };
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed applying changes');
        if (this.originalValues.certFileText === '') {
          this.formValues.certFileText = '';
        }
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
            mpsPassword: config.Credentials.MPSPassword,
            domainName: config.DomainConfiguration.DomainName,
            certPassword: config.DomainConfiguration.CertPassword,
            certFileText: config.DomainConfiguration.CertFileText,
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
