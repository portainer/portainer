angular.module('portainer.docker').controller('ContainersController', ContainersController);
import _ from 'lodash';

/* @ngInject */
function ContainersController($scope, ContainerService, Notifications, endpoint) {
  $scope.offlineMode = endpoint.Status !== 1;
  $scope.endpoint = endpoint;

  $scope.getContainers = getContainers;

  function getContainers() {
    $scope.containers = null;
    $scope.containers_t = null;
    ContainerService.containers(1)
      .then(function success(data) {
        $scope.containers_t = data;
        if ($scope.containers_t.length === 0) {
          $scope.containers = $scope.containers_t;
          return;
        }
        for (let item of $scope.containers_t) {
          ContainerService.container(item.Id).then(function success(data) {
            var Id = data.Id;
            for (var i = 0; i < $scope.containers_t.length; i++) {
              if (Id == $scope.containers_t[i].Id) {
                const gpuOptions = _.find(data.HostConfig.DeviceRequests, function (o) {
                  return o.Driver === 'nvidia' || o.Capabilities[0][0] === 'gpu';
                });
                if (!gpuOptions) {
                  $scope.containers_t[i]['Gpus'] = 'none';
                } else {
                  let gpuStr = 'all';
                  if (gpuOptions.Count !== -1) {
                    gpuStr = `id:${_.join(gpuOptions.DeviceIDs, ',')}`;
                  }
                  $scope.containers_t[i]['Gpus'] = `${gpuStr}`;
                }
              }
            }
            for (let item of $scope.containers_t) {
              if (!Object.keys(item).includes('Gpus')) {
                return;
              }
            }
            $scope.containers = $scope.containers_t;
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
}
