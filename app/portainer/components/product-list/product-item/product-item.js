angular.module('portainer.app').component('productItem', {
  templateUrl: 'app/portainer/components/product-list/product-item/productItem.html',
  bindings: {
    model: '<',
    goTo: '<'
  }
});
