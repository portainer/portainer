angular.module('portainer.kubernetes').component('kubernetesStackLogsView', {
  templateUrl: './logs.html',
  controller: 'KubernetesStackLogsController',
  controllerAs: 'ctrl',
  bindings: {
    $transition$: '<',
  },
});
