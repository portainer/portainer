angular.module('portainer.app')
  .controller('SupportController', ['$scope', '$state',
    function($scope, $state) {

      $scope.goToProductView = function(product) {
        $state.go('portainer.support.product', { product: product });
      };

      function initView() {
        var supportProducts = [
          {
            Id: 1,
            Name: 'Business Support Standard',
            ShortDescription: '11x5 support with 4 hour response',
            Price: 'US$120.00',
            PriceDescription: 'Price per month per host (minimum 10 hosts)',
            Description: 'Portainer Business Support Standard:\n\n* 7am – 6pm business days, local time.\n* 4 Hour response for issues, 4 named support contacts.\n\nPortainer support provides you with an easy way to interact directly with the Portainer development team; whether you have an issue with the product, think you have found a bug, or need help on how to use Portainer, we are here to help. Support is initiated from our web based ticketing system, and support is provided either by Slack messaging, Zoom remote support, or email.\n\nPrice is per Docker Host, with a 10 Host minimum, and is an annual support subscription.',
            ProductId: '1163'
          },
          {
            Id: 2,
            Name: 'Business Support Critical',
            ShortDescription: '24x7 support with 1 hour response',
            Price: 'US$240.00',
            PriceDescription: 'Price per month per host (minimum 10 hosts)',
            Description: 'Portainer Business Support Critical:\n\n* 24x7\n* 1 Hour response for issues, 4 named support contacts.\n\nPortainer support provides you with advanced support for critical requirements. Business Support Critical is an easy way to interact directly with the Portainer development team; whether you have an issue with the product, think you have found a bug, or need help on how to use Portainer, we are here to help. Support is initiated from our web based ticketing system, and support is provided either by Slack messaging, Zoom remote support, or email.\n\nPrice is per Docker Host, with a 10 Host minimum, and is an annual support subscription.',
            ProductId: '1162'
          }
        ];

        $scope.products = supportProducts;
      }

      initView();
    }]);
