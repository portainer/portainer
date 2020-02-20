angular.module('portainer.kubernetes').component('kubernetesResourceReservation', {
  templateUrl: './kubernetesResourceReservation.html',
  controller: 'KubernetesResourceReservationController',
  bindings: {
    description: '@',
    cpu: '<',
    cpuLimit: '<',
    memory: '<',
    memoryLimit: '<'
  }
});
