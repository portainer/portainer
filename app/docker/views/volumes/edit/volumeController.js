angular.module('portainer.docker')
.controller('VolumeController', ['$scope', '$state', '$transition$', '$q', 'ModalService', 'VolumeService', 'ContainerService', 'Notifications', 'HttpRequestHelper', 'StoridgeVolumeService', 'StoridgeSnapshotService',
function ($scope, $state, $transition$, $q, ModalService, VolumeService, ContainerService, Notifications, HttpRequestHelper, StoridgeVolumeService, StoridgeSnapshotService) {

  $scope.storidgeSnapshots = [];
  $scope.storidgeVolume = {};

  $scope.removeSnapshot = function (selectedItems) {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to remove this snapshot?',
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        var actionCount = selectedItems.length;
        angular.forEach(selectedItems, function (item) {
          StoridgeSnapshotService.remove(item.Id)
          .then(function success() {
            Notifications.success('Snapshot successfully removed', item.Id);
            var index = $scope.storidgeSnapshots.indexOf(item);
            $scope.storidgeSnapshots.splice(index, 1);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove snapshot');
          })
          .finally(function final() {
            --actionCount;
            if (actionCount === 0) {
              $state.reload();
            }
          });
        });
      }
    });
  };

  $scope.removeVolume = function removeVolume() {
    VolumeService.remove($scope.volume)
    .then(function success() {
      Notifications.success('Volume successfully removed', $transition$.params().id);
      $state.go('docker.volumes', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove volume');
    });
  };

  function getVolumeDataFromContainer(container, volumeId) {
    return container.Mounts.find(function(volume) {
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

      $scope.isCioDriver = volume.Driver.includes('cio');
      if ($scope.isCioDriver) {
        return $q.all({
          containers: ContainerService.containers(1, containerFilter),
          storidgeVolume: StoridgeVolumeService.volume($transition$.params().id)
        });
      } else {
        return ContainerService.containers(1, containerFilter);
      }
    })
    .then(function success(data) {
      var dataContainers = $scope.isCioDriver ? data.containers : data;

      var containers = dataContainers.map(function(container) {
        container.volumeData = getVolumeDataFromContainer(container, $scope.volume.Id);
        return container;
      });
      $scope.containersUsingVolume = containers;

      if ($scope.isCioDriver) {
        $scope.storidgeVolume = data.storidgeVolume;
        if ($scope.storidgeVolume.SnapshotEnabled) {
          return StoridgeSnapshotService.snapshots(data.storidgeVolume.Vdisk);
        }
      }
    })
    .then(function success(data) {
      $scope.storidgeSnapshots = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve volume details');
    });
  }

  initView();
}]);
