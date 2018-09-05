angular.module('portainer.docker')
.controller('HostOverviewController', ['$q', '$scope', 'SystemService', 'Notifications',
function HostOverviewController($q, $scope, SystemService, Notifications) {

  function initView() {
    $q.all({
      version: SystemService.version(),
      info: SystemService.info()
    })
    .then(function success(data) {
      $scope.version = data.version;
      $scope.info = data.info;
    })
    .catch(function error(err) {
      $scope.info = {};
      $scope.version = {};
      Notifications.error('Failure', err, 'Unable to retrieve engine details');
    });
  }

  initView();
}]);
