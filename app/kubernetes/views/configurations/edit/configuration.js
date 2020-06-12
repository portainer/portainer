angular.module('portainer.kubernetes').component('kubernetesConfigurationView', {
  templateUrl: './configuration.html',
  controller: 'KubernetesConfigurationController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
