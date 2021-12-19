angular.module('portainer.docker').controller('ContainersController', ContainersController);

/* @ngInject */
function ContainersController($scope, ContainerService, Notifications, endpoint) {
  $scope.offlineMode = endpoint.Status !== 1;
  $scope.endpoint = endpoint;

  $scope.getContainers = getContainers;

  function getContainers() {
    ContainerService.containers(1)
      .then(function success(data) {
        $scope.containers = data;
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
}
