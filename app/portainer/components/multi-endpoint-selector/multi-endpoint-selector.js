angular.module('portainer.app').component('multiEndpointSelector', {
  templateUrl: 'app/portainer/components/multi-endpoint-selector/multiEndpointSelector.html',
  controller: 'MultiEndpointSelectorController',
  bindings: {
    'model': '=',
    'endpoints': '<',
    'groups': '<'
  }
});
