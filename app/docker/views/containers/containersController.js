import angular from 'angular';

angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'EndpointProvider',
function ($scope, ContainerService, Notifications, EndpointProvider) {

  $scope.offlineMode = false;

  function initView() {
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

  initView();
}]);
