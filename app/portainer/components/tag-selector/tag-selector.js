angular.module('portainer.app').component('tagSelector', {
  templateUrl: 'app/portainer/components/tag-selector/tagSelector.html',
  bindings: {
    tags: '<',
    model: '='
  }
});
