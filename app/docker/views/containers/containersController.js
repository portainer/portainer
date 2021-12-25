angular.module('portainer.docker').controller('ContainersController', [
  '$scope',
  'ContainerService',
  'Notifications',
  'EndpointProvider',
  function ($scope, ContainerService, Notifications, EndpointProvider) {
    $scope.offlineMode = false;

    $scope.getContainers = getContainers;

    function getContainers() {
      ContainerService.containers(1)
        .then(function success(data) {
          $scope.containers = data;
          $scope.offlineMode = EndpointProvider.offlineMode();
          for (let item of $scope.containers) {
            ContainerService.container(item.Id).then(function success(data) {
              var Id = data.Id;
              for (var i = 0; i < $scope.containers.length; i++) {
                if (Id == $scope.containers[i].Id) {
                  $scope.containers[i]['HostConfig'] = data.HostConfig;
                }
              }
            });
          }
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
  },
]);
