angular.module('containerLogs', [])
.controller('ContainerLogsController', ['$scope', '$transition$', 'ContainerService', 'Notifications',
function ($scope, $transition$, ContainerService, Notifications) {

  $scope.ContainerId = $transition$.params().id;
  
  function initView() {
      ContainerService.container($transition$.params().id).then(function(container) {
        $scope.container = container;
      }).catch(function(err) {
        Notifications.error('Failure', err, 'Unable to retrieve container info');
      });
  }

  initView();

}]);
