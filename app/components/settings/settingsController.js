angular.module('settings', [])
.controller('SettingsController', ['$scope', '$state', 'Notifications', 'SettingsService', 'DEFAULT_TEMPLATES_URL',
function ($scope, $state, Notifications, SettingsService, DEFAULT_TEMPLATES_URL) {

  $scope.formValues = {
    customLogo: false,
    customTemplates: false
  };

  $scope.updateSettings = function() {
    $('#loadingViewSpinner').show();
    var settings = $scope.settings;

    if (!$scope.formValues.customLogo) {
      settings.LogoURL = '';
    }

    if (!$scope.formValues.customTemplates) {
      settings.TemplatesURL = DEFAULT_TEMPLATES_URL;
    }

    SettingsService.update(settings)
    .then(function success(data) {
      Notifications.success('Settings updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update settings');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    SettingsService.settings()
    .then(function success(data) {
      var settings = data;
      if (settings.LogoURL !== '') {
        $scope.formValues.customLogo = true;
      }
      if (settings.TemplatesURL !== DEFAULT_TEMPLATES_URL) {
        $scope.formValues.customTemplates = true;
      }
      $scope.settings = settings;
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
