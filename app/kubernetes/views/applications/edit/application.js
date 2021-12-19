angular.module('portainer.kubernetes').component('kubernetesApplicationView', {
  templateUrl: './application.html',
  controller: 'KubernetesApplicationController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
