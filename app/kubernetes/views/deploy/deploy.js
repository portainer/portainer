angular.module('portainer.kubernetes').component('kubernetesDeployView', {
  templateUrl: './deploy.html',
  controller: 'KubernetesDeployController',
  controllerAs: 'ctrl',
  bindings: {
    endpoint: '<',
  },
});
