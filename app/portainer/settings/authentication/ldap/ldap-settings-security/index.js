export const ldapSettingsSecurity = {
  templateUrl: './ldap-settings-security.html',
  bindings: {
    settings: '=',
    tlscaCert: '<',
    onTlscaCertChange: '<',
    uploadInProgress: '<',
    title: '@',
    limitedFeatureId: '<',
  },
  controller: LdapController,
};

// temp controller until the parent component is in react
/* @ngInject */
function LdapController($scope) {
  const self = this;
  self.reactValues = { startTLS: false, tls: false, tlsSkipVerify: false, caCertFile: null };

  self.$onInit = $onInit;
  self.$onChanges = $onChanges;
  self.getUploadState = getUploadState;
  self.onChangeReactValues = onChangeReactValues;

  function $onInit() {
    updateReactValuesFile(self.tlscaCert || null);
    updateReactValuesFromSettings(self.settings);
  }

  function getUploadState() {
    if (self.uploadInProgress) {
      return 'uploading';
    }

    if (self.tlscaCert && self.tlscaCert === self.settings.TLSConfig.TLSCACert) {
      return 'success';
    }

    return undefined;
  }

  function updateReactValuesFromSettings(settings) {
    self.reactValues = {
      ...self.reactValues,
      startTLS: settings.StartTLS,
      tls: settings.TLSConfig.TLS,
      tlsSkipVerify: settings.TLSConfig.TLSSkipVerify,
    };
  }

  function updateReactValuesFile(file) {
    self.reactValues = {
      ...self.reactValues,
      caCertFile: file,
    };
  }

  function onChangeReactValues(values) {
    $scope.$evalAsync(() => {
      self.reactValues = { ...self.reactValues, ...values };

      if ('startTLS' in values) {
        self.settings.StartTLS = values.startTLS;
      }

      if ('tls' in values) {
        self.settings.TLSConfig.TLS = values.tls;
      }

      if ('tlsSkipVerify' in values) {
        self.settings.TLSConfig.TLSSkipVerify = values.tlsSkipVerify;
      }

      if ('caCertFile' in values) {
        self.tlscaCert = values.caCertFile;
        self.onTlscaCertChange(values.caCertFile);
      }
    });
  }

  function $onChanges({ settings, tlscaCert }) {
    if (settings && settings.currentValue) {
      updateReactValuesFromSettings(settings.currentValue);
    }
    if (tlscaCert) {
      updateReactValuesFile(tlscaCert.currentValue || null);
    }
  }
}
