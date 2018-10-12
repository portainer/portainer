angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'EndpointProvider',
function ($scope, ContainerService, Notifications, EndpointProvider) {

  function initView() {
    $scope.endpointStatus = EndpointProvider.endpointStatus();
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
