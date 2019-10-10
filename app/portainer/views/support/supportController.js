angular.module('portainer.app')
  .controller('SupportController', ['$scope', '$state', 'SupportService', 'Notifications',
    function($scope, $state, SupportService, Notifications) {

      $scope.goToProductView = function(product) {
        $state.go('portainer.support.product', { product: product });
      };

      function initView() {

        SupportService.supportProducts()
        .then(function success(data){
          $scope.products = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to fetch support options');
        });
      }

      initView();
    }]);
