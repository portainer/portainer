angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'EndpointProvider',
function ($scope, ContainerService, Notifications, EndpointProvider) {

  $scope.endpointStatus = 1;

  function initView() {
    ContainerService.containers(1)
    .then(function success(data) {
      $scope.containers = data;
      $scope.endpointStatus = EndpointProvider.endpointStatus();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve containers');
      $scope.containers = [];
    });
  }

  initView();
}]);
