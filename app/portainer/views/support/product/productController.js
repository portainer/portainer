angular.module('portainer.app')
.controller('SupportProductController', ['$scope', '$transition$',
function ($scope, $transition$) {

  function initView() {
    $scope.product = $transition$.params().product;
  }

  initView();
}]);
