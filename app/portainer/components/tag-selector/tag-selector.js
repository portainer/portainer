angular.module('portainer.app').component('tagSelector', {
  templateUrl: 'app/portainer/components/tag-selector/tagSelector.html',
  controller: 'TagSelectorController',
  bindings: {
    tags: '<',
    model: '='
  }
});
