angular.module('settingsLDAP', [])
.controller('SettingsLDAPController', ['$scope', '$state', 'Notifications', 'SettingsService', 'StateManager', 'DEFAULT_TEMPLATES_URL',
function ($scope, $state, Notifications, SettingsService, StateManager, DEFAULT_TEMPLATES_URL) {

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

  $scope.saveSettings = function() {
    var settings = $scope.settings;
    console.log(JSON.stringify(settings, null, 4));

    // updateSettings(settings, false);
  };

  function updateSettings(settings, resetForm) {
    $('#loadingViewSpinner').show();

    SettingsService.update(settings)
    .then(function success(data) {
      Notifications.success('Settings updated');
      StateManager.updateLogo(settings.LogoURL);
      StateManager.updateExternalContributions(settings.DisplayExternalContributors);
      if (resetForm) {
        resetFormValues();
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update settings');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

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
