angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications',
function ($scope, ContainerService, Notifications) {

  function initView() {
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
