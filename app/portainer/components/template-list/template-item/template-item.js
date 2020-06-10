angular.module('portainer.app').component('templateItem', {
  templateUrl: './templateItem.html',
  bindings: {
    model: '<',
    typeLabel: '@',
    onSelect: '<',
  },
  transclude: {
    actions: '?templateItemActions',
  },
});
