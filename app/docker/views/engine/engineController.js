angular.module('portainer.docker')
.controller('EngineController', ['$q', '$scope', 'SystemService', 'Notifications', 'StateManager',
function ($q, $scope, SystemService, Notifications, StateManager) {

  function initView() {
    $scope.endpointStatus = StateManager.getState().endpoint.status;
    $q.all({
      version: SystemService.version(),
      info: SystemService.info()
    })
    .then(function success(data) {
      $scope.version = data.version;
      $scope.info = data.info;
    })
    .catch(function error(err) {
      $scope.info = {};
      $scope.version = {};
      Notifications.error('Failure', err, 'Unable to retrieve engine details');
    });
  }

  initView();
}]);
