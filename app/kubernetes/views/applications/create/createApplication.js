angular.module('portainer.kubernetes').component('kubernetesCreateApplicationView', {
  templateUrl: './createApplication.html',
  controller: 'KubernetesCreateApplicationController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
