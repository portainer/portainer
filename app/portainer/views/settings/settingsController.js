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

    $scope.formValues = {};

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
      }
    }

    function initView() {
      SettingsService.settings()
        .then(function success(settings) {
          $scope.settings = settings;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
