angular.module('portainer.app')
.controller('SupportController', ['$scope', '$state',
function ($scope, $state) {

  $scope.goToProductView = function(product) {
    $state.go('portainer.support.product', { product: product });
  };

  function initView() {
    var supportProducts = [
      {
        Name: '11x5 support',
        ShortDescription: '11x5 support with 4h SLA',
        Price: 'USD 120 per month',
        Description: 'USD 120 per host per month (minimum 10 hosts).',
        StoreID: '1163',
        URL: 'https://2-portainer.pi.bypronto.com/product/portainer-11x5-support-per-docker-host/'
      },
      {
        Name: '24x7 support',
        ShortDescription: '24x7 support with 1h SLA',
        Price: 'USD 240 per month',
        Description: 'USD 240 per host per month (minimum 10 hosts).',
        StoreID: '1162',
        URL: 'https://2-portainer.pi.bypronto.com/product/portainer-24x7-support-per-docker-host/'
      }
    ];

    $scope.products = supportProducts;
  }

  initView();
}]);
