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
        Description: 'Portainer 11x5 Support, with 4 Hour SLA for critical issues, 4 named support contacts. \nPortainer support provides you with an easy way to interact directly with the Portainer development team; whether you have an issue with the product, think you have found a bug, or need help on how to use Portainer, we are here to help. \nSupport is initiated from our web based ticketing system, and support is provided either by Slack messaging, Zoom remote support, or email. \nPrice is per Docker Host, with a 10 Host minimum, and is an annual support subscription.',
        StoreID: '1163',
        URL: 'https://2-portainer.pi.bypronto.com/product/portainer-11x5-support-per-docker-host/'
      },
      {
        Name: '24x7 support',
        ShortDescription: '24x7 support with 1h SLA',
        Price: 'USD 240 per month',
        Description: 'Portainer 24x7 Support, with 1 Hour SLA for critical issues, 4 named support contacts. \nPortainer support provides you with an easy way to interact directly with the Portainer development team; whether you have an issue with the product, think you have found a bug, or need help on how to use Portainer, we are here to help. \nSupport is initiated from our web based ticketing system, and support is provided either by Slack messaging, Zoom remote support, or email. \nPrice is per Docker Host, with a 10 Host minimum, and is an annual support subscription.',
        StoreID: '1162',
        URL: 'https://2-portainer.pi.bypronto.com/product/portainer-24x7-support-per-docker-host/'
      }
    ];

    $scope.products = supportProducts;
  }

  initView();
}]);
