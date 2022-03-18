import { ResourceControlType } from '@/portainer/access-control/types';

angular.module('portainer.docker').controller('VolumeController', [
  '$scope',
  '$state',
  '$transition$',
  '$q',
  'ModalService',
  'VolumeService',
  'ContainerService',
  'Notifications',
  'HttpRequestHelper',
  function ($scope, $state, $transition$, $q, ModalService, VolumeService, ContainerService, Notifications, HttpRequestHelper) {
    $scope.resourceType = ResourceControlType.Volume;

    $scope.onUpdateResourceControlSuccess = function () {
      $state.reload();
    };

    $scope.removeVolume = function removeVolume() {
      ModalService.confirmDeletion('Do you want to remove this volume?', (confirmed) => {
        if (confirmed) {
          VolumeService.remove($scope.volume)
            .then(function success() {
              Notifications.success('Volume successfully removed', $transition$.params().id);
              $state.go('docker.volumes', {});
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to remove volume');
            });
        }
      });
    };

    function getVolumeDataFromContainer(container, volumeId) {
      return container.Mounts.find(function (volume) {
        return volume.Name === volumeId;
      });
    }

    function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);

      VolumeService.volume($transition$.params().id)
        .then(function success(data) {
          var volume = data;
          $scope.volume = volume;
          var containerFilter = { volume: [volume.Id] };

          return ContainerService.containers(1, containerFilter);
        })
        .then(function success(data) {
          var dataContainers = $scope.isCioDriver ? data.containers : data;

          var containers = dataContainers.map(function (container) {
            container.volumeData = getVolumeDataFromContainer(container, $scope.volume.Id);
            return container;
          });
          $scope.containersUsingVolume = containers;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve volume details');
        });
    }

    initView();
  },
]);
