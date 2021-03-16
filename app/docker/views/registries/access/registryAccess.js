angular.module('portainer.docker').component('dockerRegistryAccessView', {
  templateUrl: './registryAccess.html',
  controller: 'DockerRegistryAccessController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
