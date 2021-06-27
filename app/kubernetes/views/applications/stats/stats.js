angular.module('portainer.kubernetes').component('kubernetesApplicationStatsView', {
  templateUrl: './stats.html',
  controller: 'KubernetesApplicationStatsController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
