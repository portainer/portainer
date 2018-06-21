angular.module('portainer.app').component('sidebarEndpointSelector', {
  templateUrl: 'app/portainer/components/sidebar-endpoint-selector/sidebarEndpointSelector.html',
  controller: 'SidebarEndpointSelectorController',
  bindings: {
    'endpoints': '<',
    'groups': '<',
    'selectEndpoint': '<'
  }
});
