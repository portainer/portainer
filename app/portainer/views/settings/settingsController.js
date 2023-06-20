import angular from 'angular';

angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  'Notifications',
  'SettingsService',
  'StateManager',
  function ($scope, Notifications, SettingsService, StateManager) {
    $scope.updateSettings = updateSettings;
    $scope.handleSuccess = handleSuccess;

    $scope.state = {
      actionInProgress: false,
      showHTTPS: !window.ddExtension,
    };

    $scope.formValues = {
      BlackListedLabels: [],
      labelName: '',
      labelValue: '',
    };

    $scope.removeFilteredContainerLabel = function (index) {
      const filteredSettings = $scope.formValues.BlackListedLabels.filter((_, i) => i !== index);
      const filteredSettingsPayload = { BlackListedLabels: filteredSettings };
      updateSettings(filteredSettingsPayload, 'Hidden container settings updated');
    };

    $scope.addFilteredContainerLabel = function () {
      var label = {
        name: $scope.formValues.labelName,
        value: $scope.formValues.labelValue,
      };

      const filteredSettings = [...$scope.formValues.BlackListedLabels, label];
      const filteredSettingsPayload = { BlackListedLabels: filteredSettings };
      updateSettings(filteredSettingsPayload, 'Hidden container settings updated');
    };

    function updateSettings(settings, successMessage = 'Settings updated') {
      return SettingsService.update(settings)
        .then(function success(settings) {
          Notifications.success('Success', successMessage);
          handleSuccess(settings);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update settings');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function handleSuccess(settings) {
      if (settings) {
        StateManager.updateLogo(settings.LogoURL);
        StateManager.updateSnapshotInterval(settings.SnapshotInterval);
        StateManager.updateEnableTelemetry(settings.EnableTelemetry);
        $scope.formValues.BlackListedLabels = settings.BlackListedLabels;
      }
    }

    function initView() {
      SettingsService.settings()
        .then(function success(data) {
          var settings = data;
          $scope.settings = settings;

          $scope.formValues.BlackListedLabels = settings.BlackListedLabels;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
