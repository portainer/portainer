angular.module('portainer.app').component('multiEndpointSelector', {
  templateUrl: './multiEndpointSelector.html',
  controller: 'MultiEndpointSelectorController',
  bindings: {
    'model': '=',
    'endpoints': '<',
    'groups': '<'
  }
});
