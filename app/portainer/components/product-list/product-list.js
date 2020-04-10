angular.module('portainer.app').component('productList', {
  templateUrl: './productList.html',
  bindings: {
    titleText: '@',
    products: '<',
    goTo: '<',
  },
});
