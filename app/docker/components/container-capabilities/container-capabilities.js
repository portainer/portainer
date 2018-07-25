angular.module('portainer.docker').component('containerCapabilities', {
  templateUrl: 'app/docker/components/container-capabilities/containerCapabilities.html',
  controller: 'ContainerCapabilitiesController',
  bindings: {
    capabilities: '='
  }
});
