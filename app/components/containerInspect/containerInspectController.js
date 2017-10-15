angular.module('containerInspect', [])
.controller('ContainerInspectController', ['$scope', '$transition$', 'Notifications', 'ContainerService',
function ($scope, $transition$, Notifications, ContainerService) {
  $scope.state = {};
  $scope.state.loaded = false;
  
  ContainerService.inspect($transition$.params().id)
  .then(function success(d) {
    $scope.data = d;
  })
  .catch(function error(e) {
    Notifications.error('Failure', e, 'Unable to inspect container');
    $('#loadingViewSpinner').hide();
  })
  .finally(function final() {
    $scope.state.loaded = true;
  });
}]);
