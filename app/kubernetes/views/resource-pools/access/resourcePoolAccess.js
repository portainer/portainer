angular.module('portainer.kubernetes').component('kubernetesResourcePoolAccessView', {
  templateUrl: './resourcePoolAccess.html',
  controller: 'KubernetesResourcePoolAccessController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
