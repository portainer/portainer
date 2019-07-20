angular.module('portainer.integrations.storidge')
.controller('StoridgeSnapshotController', ['$scope', '$state', '$transition$', 'Notifications', 'ModalService', 'StoridgeSnapshotService',
function ($scope, $state, $transition$, Notifications, ModalService, StoridgeSnapshotService) {

  $scope.removeSnapshot = function () {
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
        StoridgeSnapshotService.remove($scope.snapshot.Id)
        .then(function () {
          Notifications.success('Success', 'Snapshot removed');
          $state.go('portainer.volumes.volume', {id: $scope.volumeId});
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove snapshot');
        });
      }
    });
  };

  function initView() {
    $scope.volumeId = $transition$.params().id;
    $scope.snapshotId = $transition$.params().snapshotId;

    StoridgeSnapshotService.snapshot($scope.snapshotId)
    .then(function success(data) {
      $scope.snapshot = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve snapshot details');
    });
  }

  initView();

}]);
