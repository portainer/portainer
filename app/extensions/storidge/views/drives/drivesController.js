angular.module('extension.storidge')
.controller('StoridgeDrivesController', ['$scope', '$state', 'Notifications', 'StoridgeDriveService',
function ($scope, $state, Notifications, StoridgeDriveService) {

  $scope.addAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    selectedItems = selectedItems.filter(function (item) {
      return item.Status === 'available';
    });
    angular.forEach(selectedItems, function (drive) {
      StoridgeDriveService.add(drive.Device, drive.Node)
      .then(function success() {
        Notifications.success('Drive ' + drive.Device + ' successfully added on node ' + drive.Node);
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

  $scope.rescanAction = function () {
    StoridgeDriveService.rescan()
    .then(function sucess() {
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to scan drives');
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
