import angular from 'angular';

angular.module('portainer.app').controller('SettingsEdgeComputeController', SettingsEdgeComputeController);

function SettingsEdgeComputeController($q, $scope, $state, Notifications, SettingsService, StateManager) {

  $scope.onSubmit = function(settings) {
    SettingsService.update(settings)
        .then(function success() {
          Notifications.success('Settings updated');
          StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update settings');
        })
  }

  function initView() {
      SettingsService.settings()
      .then(function success(data) {
          $scope.settings = data;
      })
      .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
      });
  }

  initView();
}
