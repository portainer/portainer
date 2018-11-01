angular.module('portainer.app')
.controller('SupportController', ['$scope', '$state',
function ($scope, $state) {

  $scope.goToProductView = function(product) {
    $state.go('portainer.support.product', { product: product });
  };

  function initView() {
    var supportProducts = [
      {
        Name: 'Business support',
        ShortDescription: '9am-5pm Business Production Support',
        Price: 'USD 150 per month',
        Description: 'USD 150 per month (up to 10 Docker hosts) plus USD 15 per host per month beyond 10 Docker hosts. With 9am-5pm Business Production Support subscription, paid annually in advance.'
      }
    ];

    $scope.products = supportProducts;
  }

  initView();
}]);
