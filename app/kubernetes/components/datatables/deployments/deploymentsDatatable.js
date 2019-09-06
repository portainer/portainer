angular.module('portainer.kubernetes').component('kubernetesDeploymentsDatatable', {
  templateUrl: './deploymentsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    dataset: '<',
    serviceId: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    textFilter: '='
  }
});
