angular.module('portainer.kubernetes').component('deploymentsDatatable', {
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
