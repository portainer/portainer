angular.module('portainer.app').component('endpointSelector', {
  templateUrl: 'app/portainer/components/endpoint-selector/endpointSelector.html',
  controller: 'EndpointSelectorController',
  bindings: {
    'model': '=',
    'endpoints': '<',
    'groups': '<'
  }
});
