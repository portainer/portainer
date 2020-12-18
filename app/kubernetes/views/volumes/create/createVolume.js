angular.module('portainer.kubernetes').component('kubernetesCreateVolumeView', {
  templateUrl: './createVolume.html',
  controller: 'KubernetesCreateVolumeController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
