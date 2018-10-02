angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'StateManager',
function ($scope, ContainerService, Notifications, StateManager) {

  function initView() {
    $scope.endpointStatus = StateManager.getState().endpoint.status;
    ContainerService.containers(1)
    .then(function success(data) {
      $scope.containers = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve containers');
      $scope.containers = [];
    });
  }

  initView();
}]);
