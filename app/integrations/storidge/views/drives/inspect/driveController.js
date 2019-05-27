angular.module('portainer.integrations.storidge')
.controller('StoridgeDriveController', ['$scope', '$state', '$transition$', 'Notifications', 'ModalService', 'StoridgeDriveService',
function ($scope, $state, $transition$, Notifications, ModalService, StoridgeDriveService) {

  $scope.actionInProgress = false;

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
        $scope.actionInProgress = true;
        StoridgeDriveService.remove($scope.drive.Id)
        .then(function () {
          Notifications.success('Success', 'Drive removed from storage pool');
          $state.go('storidge.drives', {}, { reload:true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove drive from storage pool');
        })
        .finally(function final() {
          $scope.actionInProgress = false;
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
