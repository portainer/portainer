angular.module('portainer.app')
.controller('PluginsController', ['$q', '$scope', 'StatusService',
function ($q, $scope, StatusService) {

  function initView() {
    StatusService.status()
    .then(function onSuccess(data) {
      $scope.enabledPlugins = data.EnabledPlugins;
    })
    .catch(function onError(err) {
      Notifications.error('Failure', err, 'Unable to retrieve application status');
    });
  }

  initView();
}]);
