angular.module('settingsLDAP', [])
.controller('SettingsLDAPController', ['$q', '$scope', 'Notifications', 'SettingsService', 'FileUploadService',
function ($q, $scope, Notifications, SettingsService, FileUploadService) {

  $scope.state = {
    successfulConnectivityCheck: false,
    failedConnectivityCheck: false,
    uploadInProgress: false
  };

  $scope.formValues = {
    TLSCACert: '',
    TLSCert: '',
    TLSKey: ''
  };

  $scope.addSearchConfiguration = function() {
    $scope.LDAPSettings.SearchSettings.push({ BaseDN: '', UserNameAttribute: '', Filter: '' });
  };

  $scope.removeSearchConfiguration = function(index) {
    $scope.LDAPSettings.SearchSettings.splice(index, 1);
  };

  $scope.connectivityCheck = function(tls) {
    $('#connectivityCheckSpinner').show();
    var settings = $scope.settings;
    var TLSCAFile = $scope.formValues.TLSCACert !== settings.LDAPSettings.TLSConfig.TLSCACert ? $scope.formValues.TLSCACert : null;
    var TLSCertFile = $scope.formValues.TLSCert !== settings.LDAPSettings.TLSConfig.TLSCert ? $scope.formValues.TLSCert : null;
    var TLSKeyFile = $scope.formValues.TLSKey !== settings.LDAPSettings.TLSConfig.TLSKey ? $scope.formValues.TLSKey : null;

    $scope.state.uploadInProgress = tls;

    $q.when(!tls || FileUploadService.uploadLDAPTLSFiles(TLSCAFile, TLSCertFile, TLSKeyFile))
    .then(function success(data) {
      return SettingsService.checkLDAPConnectivity(settings);
    })
    .then(function success(data) {
      $scope.state.failedConnectivityCheck = false;
      $scope.state.successfulConnectivityCheck = true;
      Notifications.success('Connection to LDAP successful');
    })
    .catch(function error(err) {
      $scope.state.failedConnectivityCheck = true;
      $scope.state.successfulConnectivityCheck = false;
      Notifications.error('Failure', err, 'Connection to LDAP failed');
    })
    .finally(function final() {
      $scope.state.uploadInProgress = false;
      $('#connectivityCheckSpinner').hide();
    });
  };

  $scope.saveSettings = function() {
    $('#updateSettingsSpinner').show();
    var settings = $scope.settings;
    var TLSCAFile = $scope.formValues.TLSCACert !== settings.LDAPSettings.TLSConfig.TLSCACert ? $scope.formValues.TLSCACert : null;
    var TLSCertFile = $scope.formValues.TLSCert !== settings.LDAPSettings.TLSConfig.TLSCert ? $scope.formValues.TLSCert : null;
    var TLSKeyFile = $scope.formValues.TLSKey !== settings.LDAPSettings.TLSConfig.TLSKey ? $scope.formValues.TLSKey : null;
    // var TLSCAFile = $scope.formValues.TLSCACert;
    // var TLSCertFile = $scope.formValues.TLSCert;
    // var TLSKeyFile = $scope.formValues.TLSKey;

    var tls = $scope.LDAPSettings.TLSConfig.TLS;
    $scope.state.uploadInProgress = tls;

    $q.when(!tls || FileUploadService.uploadLDAPTLSFiles(TLSCAFile, TLSCertFile, TLSKeyFile))
    .then(function success(data) {
      return SettingsService.update(settings);
    })
    .then(function success(data) {
      Notifications.success('LDAP settings updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update LDAP settings');
    })
    .finally(function final() {
      $scope.state.uploadInProgress = false;
      $('#updateSettingsSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    SettingsService.settings()
    .then(function success(data) {
      var settings = data;
      $scope.settings = settings;
      $scope.LDAPSettings = settings.LDAPSettings;
      $scope.formValues.TLSCACert = settings.LDAPSettings.TLSConfig.TLSCACert;
      $scope.formValues.TLSCert = settings.LDAPSettings.TLSConfig.TLSCert;
      $scope.formValues.TLSKey = settings.LDAPSettings.TLSConfig.TLSKey;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve application settings');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
