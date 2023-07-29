angular.module('portainer.kubernetes').component('kubernetesSecretView', {
  templateUrl: './secret.html',
  controller: 'KubernetesSecretController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
