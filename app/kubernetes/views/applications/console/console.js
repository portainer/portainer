angular.module('portainer.kubernetes').component('kubernetesApplicationConsoleView', {
  templateUrl: './console.html',
  controller: 'KubernetesApplicationConsoleController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
