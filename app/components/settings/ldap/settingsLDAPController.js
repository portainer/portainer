angular.module('settingsLDAP', [])
.controller('SettingsLDAPController', ['$scope', '$state', 'Notifications', 'SettingsService', 'StateManager', 'DEFAULT_TEMPLATES_URL',
function ($scope, $state, Notifications, SettingsService, StateManager, DEFAULT_TEMPLATES_URL) {

  $scope.state = {
    successfulConnectivityCheck: false,
    failedConnectivityCheck: false
  };

  $scope.formValues = {

    // useLDAPAuthentication: true,
    // TLS: false,
    // searchConfigurations: [
    //   {
    //     BaseDN: '',
    //     UsernameAttr: '',
    //     Filter: ''
    //   }
    // ]
  };

  $scope.addSearchConfiguration = function() {
    $scope.LDAPSettings.SearchSettings.push({ BaseDN: '', UserNameAttribute: '', Filter: '' });
  };

  $scope.removeSearchConfiguration = function(index) {
    $scope.LDAPSettings.SearchSettings.splice(index, 1);
  };

  $scope.connectivityCheck = function() {
    $('#connectivityCheckSpinner').show();
    var LDAPSettings = $scope.settings;

    SettingsService.checkLDAPConnectivity(LDAPSettings)
    .then(function success(data) {
      $scope.state.failedConnectivityCheck = false;
      $scope.state.successfulConnectivityCheck = true;
      Notifications.success('Connection to LDAP successful');
    })
    .catch(function error(err) {
      $scope.state.failedConnectivityCheck = true;
      $scope.state.successfulConnectivityCheck = false;
      Notifications.error('Failure', err, 'Unable to update LDAP settings');
    })
    .finally(function final() {
      $('#connectivityCheckSpinner').hide();
    });
  };

  $scope.saveSettings = function() {
    $('#updateSettingsSpinner').show();
    var settings = $scope.settings;

    SettingsService.update(settings)
    .then(function success(data) {
      Notifications.success('LDAP settings updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update LDAP settings');
    })
    .finally(function final() {
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
