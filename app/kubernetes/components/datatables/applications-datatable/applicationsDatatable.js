angular.module('portainer.kubernetes').component('kubernetesApplicationsDatatable', {
  templateUrl: './applicationsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    deploymentTypes: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    refreshCallback: '<'
  }
});