angular.module('portainer.kubernetes').component('kubernetesDeploymentsDatatable', {
  templateUrl: './deploymentsDatatable.html',
  controller: 'KubernetesDeploymentsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<'
  }
});
