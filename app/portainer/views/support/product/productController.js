angular.module('portainer.app').controller('SupportProductController', [
  '$scope',
  '$transition$',
  function ($scope, $transition$) {
    $scope.formValues = {
      hostCount: 0,
    };

    $scope.state = {
      minHosts: 0,
      placeholder: 0,
      supportType: '',
    };

    $scope.isBuyButtonEnabled = function () {
      return !$scope.formValues.hostCount || $scope.formValues.hostCount < $scope.state.minHosts;
    };

    function initView() {
      $scope.product = $transition$.params().product;

      if ($scope.product.Id == 1) {
        $scope.formValues.hostCount = 1;
        $scope.state.minHosts = 1;
        $scope.state.placeholder = 1;
        $scope.state.supportType = 'Person';
      }
      if ($scope.product.Id == 2 || $scope.product.Id == 3) {
        $scope.formValues.hostCount = 4;
        $scope.state.minHosts = 4;
        $scope.state.placeholder = 4;
        $scope.state.supportType = 'Host';
      }
      if ($scope.product.Id == 4 || $scope.product.Id == 5) {
        $scope.formValues.hostCount = 10;
        $scope.state.minHosts = 10;
        $scope.state.placeholder = 10;
        $scope.state.supportType = 'Host';
      }
    }

    initView();
  },
]);
