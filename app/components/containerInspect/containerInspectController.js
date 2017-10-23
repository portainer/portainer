angular.module('containerInspect', ['angular-json-tree'])
.controller('ContainerInspectController', ['$scope', '$transition$', 'Notifications', 'ContainerService',
function ($scope, $transition$, Notifications, ContainerService) {
  function initView() {
    $('#loadingViewSpinner').show();

    ContainerService.inspect($transition$.params().id)
    .then(function success(d) {
      $scope.containerInfo.object = d;
      //$scope.containerInfo.date = new Date();
    })
    .catch(function error(e) {
      Notifications.error('Failure', e, 'Unable to inspect container');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  $scope.containerInfo = { object: {} };
  $scope.TextView = false;
  $scope.toggle = function() { $scope.TextView = !$scope.TextView; };
  //$scope.EncodeJSON = function(obj){ return encodeURIComponent(JSON.stringify(obj, null, 2)); };
  initView();
}]);
