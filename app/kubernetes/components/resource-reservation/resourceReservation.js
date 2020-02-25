angular.module('portainer.kubernetes').component('kubernetesResourceReservation', {
  templateUrl: './resourceReservation.html',
  controller: 'KubernetesResourceReservationController',
  bindings: {
    description: '@',
    cpu: '<',
    cpuLimit: '<',
    memory: '<',
    memoryLimit: '<'
  }
});
