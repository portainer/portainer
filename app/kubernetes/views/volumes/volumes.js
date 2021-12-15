angular.module('portainer.kubernetes').component('kubernetesVolumesView', {
  templateUrl: './volumes.html',
  controller: 'KubernetesVolumesController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
