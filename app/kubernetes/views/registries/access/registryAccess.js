angular.module('portainer.kubernetes').component('kubernetesRegistryAccessView', {
  templateUrl: './registryAccess.html',
  controller: 'KubernetesRegistryAccessController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
