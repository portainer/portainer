angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'EndpointProvider',
function ($scope, ContainerService, Notifications, EndpointProvider) {

  $scope.offlineMode = false;

  $scope.getContainers = getContainers;

  function getContainers() {
    ContainerService.containers(1)
    .then(function success(data) {
      $scope.containers = data;
      $scope.offlineMode = EndpointProvider.offlineMode();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve containers');
      $scope.containers = [];
    });
  }

  function initView() {
    getContainers();
  }

  initView();
}]);
