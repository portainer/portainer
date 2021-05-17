angular.module('portainer.kubernetes').component('kubernetesResourcePoolView', {
  templateUrl: './resourcePool.html',
  controller: 'KubernetesResourcePoolController',
  controllerAs: 'ctrl',
  bindings: {
    endpoint: '<',
  },
});
