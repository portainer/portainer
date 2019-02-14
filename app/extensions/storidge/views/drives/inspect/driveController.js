angular.module('extension.storidge')
.controller('StoridgeDriveController', ['$scope', '$state', '$transition$', 'Notifications', 'StoridgeDriveService',
function ($scope, $state, $transition$, Notifications, StoridgeDriveService) {

  $scope.addDrive = function () {
    StoridgeDriveService.add($scope.drive.Device, $scope.drive.Node)
    .then(function () {
      Notifications.success('Success', 'Drive added to storage pool');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to add drive to storage pool');
    });
  };

  $scope.removeDrive = function () {
    ModalService.confirm({
      title: 'Are you sure?',
      message: 'Do you want really want to remove this drive from the storage pool?',
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger'
        }
      },
      callback: function onConfirm(confirmed) {
        if(!confirmed) { return; }
        StoridgeDriveService.remove($scope.drive.Id)
        .then(function () {
          Notifications.success('Success', 'Drive removed from storage pool');
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove drive from storage pool');
        });
      }
    });
  };

  function initView() {
    $scope.id = $transition$.params().id;

    StoridgeDriveService.drive($scope.id)
    .then(function success(data) {
      $scope.drive = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve drive details');
    });
  }

  initView();

}]);
