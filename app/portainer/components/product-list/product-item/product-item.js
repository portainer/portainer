angular.module('portainer.app').component('productItem', {
  templateUrl: './productItem.html',
  bindings: {
    model: '<',
    goTo: '<',
  },
});
