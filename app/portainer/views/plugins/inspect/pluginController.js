angular.module('portainer.app')
.controller('PluginController', ['$q', '$scope', '$transition$', '$state', 'PortainerPluginService', 'Notifications',
function ($q, $scope, $transition$, $state, PortainerPluginService, Notifications) {

  $scope.state = {
    updateInProgress: false
  };

  $scope.updatePlugin = updatePlugin;

  function updatePlugin(plugin) {
    $scope.state.updateInProgress = true;
    PortainerPluginService.update(plugin.Id, plugin.Version)
    .then(function onSuccess() {
      Notifications.success('Plugin successfully updated');
      $state.reload();
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to update plugin');
    })
    .finally(function final() {
      $scope.state.updateInProgress = false;
    });
  }

  function initView() {
    PortainerPluginService.plugin($transition$.params().id, true)
    .then(function onSuccess(plugin) {
      $scope.plugin = plugin;
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to retrieve plugin information');
    });
  }

  initView();
}]);
