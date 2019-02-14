angular.module('extension.storidge')
.controller('StoridgeDrivesController', ['$q', '$scope', '$state', 'Notifications', 'ModalService', 'StoridgeDriveService',
function ($q, $scope, $state, Notifications, ModalService, StoridgeDriveService) {

  $scope.removeAction = function(selectedItems) {
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
        var actionCount = selectedItems.length;
        selectedItems = selectedItems.filter(function (item) {
          return item.Status === 'faulty';
        });
        angular.forEach(selectedItems, function (drive) {
          StoridgeDriveService.delete(drive.Id)
          .then(function success() {
            Notifications.success('Drive successfully removed', drive.Id);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove drive');
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

  $scope.addAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    selectedItems = selectedItems.filter(function (item) {
      return item.Status === 'available';
    });
    angular.forEach(selectedItems, function (drive) {
      StoridgeDriveService.add(drive.Id)
      .then(function success() {
        Notifications.success('Drive successfully added', drive.Id);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to add drive');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  function initView() {
    StoridgeDriveService.drives()
    .then(function success(data) {
      $scope.drives = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve drives');
    });
  }

  initView();
}]);
