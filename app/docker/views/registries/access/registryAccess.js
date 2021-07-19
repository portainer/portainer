angular.module('portainer.docker').component('dockerRegistryAccessView', {
  templateUrl: './registryAccess.html',
  controller: 'DockerRegistryAccessController',
  bindings: {
    endpoint: '<',
  },
});
