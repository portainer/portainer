angular.module('portainer.docker')
.controller('ContainerInspectController', ['$scope', '$transition$', 'Notifications', 'ContainerService',
function ($scope, $transition$, Notifications, ContainerService) {

  $scope.state = {
    DisplayTextView: false
  };
  $scope.containerInfo = {};

  function initView() {
    ContainerService.inspect($transition$.params().id)
    .then(function success(d) {
      $scope.containerInfo = d;
    })
    .catch(function error(e) {
      Notifications.error('Failure', e, 'Unable to inspect container');
    });
  }

  initView();
}]);
