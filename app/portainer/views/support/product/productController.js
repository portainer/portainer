angular.module('portainer.app')
  .controller('SupportProductController', ['$scope', '$transition$',
    function($scope, $transition$) {

      $scope.formValues = {
        hostCount: 0
      };

      function initView() {
        $scope.product = $transition$.params().product;
        
        if ($scope.product.Id == 1) {
          $scope.formValues.hostCount = 1;
        }
        if ($scope.product.Id == 2 || $scope.product.Id == 3) {
          $scope.formValues.hostCount = 4;
        }
        if ($scope.product.Id == 4 || $scope.product.Id == 5) {
          $scope.formValues.hostCount = 10;
        }
      }

      initView();
    }]);
