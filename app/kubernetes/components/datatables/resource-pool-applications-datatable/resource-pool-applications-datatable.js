angular.module('portainer.kubernetes').component('kubernetesResourcePoolApplicationsDatatable', {
  templateUrl: './resource-pool-applications-datatable.html',
  controller: 'GenericDatatableController',
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