angular.module('portainer.app')
.controller('SupportProductController', ['$scope', '$transition$',
function ($scope, $transition$) {

  $scope.formValues = {
    instances: 1,
    hosts: 10
  };

  function initView() {
    $scope.product = $transition$.params().product;
  }

  initView();
}]);
