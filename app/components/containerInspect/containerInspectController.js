angular.module('containerInspect', ['angular-json-tree'])
.controller('ContainerInspectController', ['$scope', '$transition$', 'Notifications', 'ContainerService',
function ($scope, $transition$, Notifications, ContainerService) {
  function initView() {
    $('#loadingViewSpinner').show();

    ContainerService.inspect($transition$.params().id)
    .then(function success(d) {
      $scope.containerInfo.object = d;
    })
    .catch(function error(e) {
      Notifications.error('Failure', e, 'Unable to inspect container');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  $scope.containerInfo = { object: {} };
  $scope.state = { TextView: false };
  initView();
}]);
