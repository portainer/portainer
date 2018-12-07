angular.module('portainer.app')
  .controller('SupportProductController', ['$scope', '$transition$',
    function($scope, $transition$) {

      $scope.formValues = {
        hostCount: 10
      };

      function initView() {
        $scope.product = $transition$.params().product;
      }

      initView();
    }]);
