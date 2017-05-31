angular.module('settings', [])
.controller('SettingsController', ['$scope', '$state', 'Notifications', 'SettingsService', 'DEFAULT_TEMPLATES_URL',
function ($scope, $state, Notifications, SettingsService, DEFAULT_TEMPLATES_URL) {

  $scope.formValues = {
    customLogo: false,
    customTemplates: false,
    labelName: '',
    labelValue: ''
  };

  $scope.removeFilteredContainerLabel = function(index) {
    var settings = $scope.settings;
    settings.FilteredContainersLabels.splice(index, 1);

    updateSettings(settings, false);
  };

  $scope.addFilteredContainerLabel = function() {
    var settings = $scope.settings;
    var label = {
      name: $scope.formValues.labelName,
      value: $scope.formValues.labelValue
    };
    settings.FilteredContainersLabels.push(label);

    updateSettings(settings, true);
  };

  $scope.saveApplicationSettings = function() {
    var settings = $scope.settings;

    if (!$scope.formValues.customLogo) {
      settings.LogoURL = '';
    }

    if (!$scope.formValues.customTemplates) {
      settings.TemplatesURL = DEFAULT_TEMPLATES_URL;
    }

    updateSettings(settings, false);
  };

  function resetFormValues() {
    $scope.formValues.labelName = '';
    $scope.formValues.labelValue = '';
  }

  function updateSettings(settings, resetForm) {
    $('#loadingViewSpinner').show();

    SettingsService.update(settings)
    .then(function success(data) {
      Notifications.success('Settings updated');
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
