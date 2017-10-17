angular.module('containerInspect', [])
.controller('ContainerInspectController', ['$scope', '$transition$', 'Notifications', 'ContainerService',
function ($scope, $transition$, Notifications, ContainerService) {
  function initView() {
    $('#loadingViewSpinner').show();
    
    ContainerService.inspect($transition$.params().id)
    .then(function success(d) {
      $scope.data = d;
    })
    .catch(function error(e) {
      Notifications.error('Failure', e, 'Unable to inspect container');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }
  
  initView();
}]);
