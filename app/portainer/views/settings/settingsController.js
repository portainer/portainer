import angular from 'angular';

angular.module('portainer.app').controller('SettingsController', SettingsController);

/* @ngInject */
function SettingsController($scope, StateManager) {
  $scope.handleSuccess = handleSuccess;

  $scope.state = {
    showHTTPS: !window.ddExtension,
  };

  function handleSuccess(settings) {
    if (settings) {
      StateManager.updateLogo(settings.LogoURL);
      StateManager.updateSnapshotInterval(settings.SnapshotInterval);
      StateManager.updateEnableTelemetry(settings.EnableTelemetry);
    }
  }
}
