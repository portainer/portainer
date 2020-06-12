angular.module('portainer.kubernetes').component('kubernetesApplicationLogsView', {
  templateUrl: './logs.html',
  controller: 'KubernetesApplicationLogsController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
