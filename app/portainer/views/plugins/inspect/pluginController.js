angular.module('portainer.app')
.controller('PluginController', ['$q', '$scope', '$transition$', 'PortainerPluginService', 'Notifications',
function ($q, $scope, $transition$, PortainerPluginService, Notifications) {

  $scope.enablePlugin = enablePlugin;

  function enablePlugin(pluginType) {
    PortainerPluginService.enable(pluginType)
    .then(function onSuccess() {
      Notifications.success('Plugin successfully enabled');
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to enable plugin');
    });
  }

  function initView() {
    $scope.plugin = $transition$.params().plugin;
  }

  initView();
}]);
