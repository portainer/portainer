angular.module('portainer.app').component('productList', {
  templateUrl: 'app/portainer/components/product-list/productList.html',
  bindings: {
    titleText: '@',
    products: '<',
    goTo: '<'
    // plugins: '<',
    // currentDate: '<'
  }
});
