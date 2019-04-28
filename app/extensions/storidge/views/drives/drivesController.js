angular.module('extension.storidge')
.controller('StoridgeDrivesController', ['$scope', '$state', 'Notifications', 'StoridgeDriveService',
function ($scope, $state, Notifications, StoridgeDriveService) {

  $scope.addAction = function (drive) {
    StoridgeDriveService.add(drive.Device, drive.Node)
    .then(function success() {
      Notifications.success('Drive ' + drive.Device + ' successfully added on node ' + drive.Node);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to add drive');
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
