angular.module('docker', [])
.controller('DockerController', ['$q', '$scope', 'SystemService', 'Notifications',
function ($q, $scope, SystemService, Notifications) {
  $scope.info = {};
  $scope.version = {};

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      version: SystemService.version(),
      info: SystemService.info()
    })
    .then(function success(data) {
      $scope.version = data.version;
      $scope.info = data.info;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve engine details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
