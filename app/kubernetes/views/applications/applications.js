angular.module('portainer.kubernetes').component('kubernetesApplicationsView', {
  templateUrl: './applications.html',
  controller: 'KubernetesApplicationsController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
    endpoint: '<',
  },
});
