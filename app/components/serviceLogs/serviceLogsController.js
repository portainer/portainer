angular.module('serviceLogs', [])
.controller('ServiceLogsController', ['$scope', '$transition$', 'ServiceService', 'Notifications',
function ($scope, $transition$, ServiceService, Notifications) {

  $scope.ServiceId = $transition$.params().id;

  function initView() {
    ServiceService.service($transition$.params().id).then(function(service) {
      $scope.service = service;
    }).catch(function(err) {
      Notifications.error('Failure', err, 'Unable to retrieve service info');
    });
  }
  initView();

}]);
