angular.module('extension.storidge')
.controller('StoridgeNodeController', ['$scope', '$state', '$transition$', 'Notifications', 'StoridgeNodeService',
function ($scope, $state, $transition$, Notifications, StoridgeNodeService) {


  function initView() {
    $scope.name = $transition$.params().name;

    StoridgeNodeService.node($scope.name)
    .then(function success(data) {
      $scope.node = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve node details');
    });
  }

  initView();

}]);
