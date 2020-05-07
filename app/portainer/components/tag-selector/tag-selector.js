angular.module('portainer.app').component('tagSelector', {
  templateUrl: './tagSelector.html',
  controller: 'TagSelectorController',
  bindings: {
    tags: '<',
    model: '=',
    onCreate: '<',
    allowCreate: '<',
  },
});
