angular.module('portainer.kubernetes').component('kubernetesVolumeView', {
  templateUrl: './volume.html',
  controller: 'KubernetesVolumeController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
