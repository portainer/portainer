angular.module('ui').component('endpointsDatatable', {
  templateUrl: 'app/directives/ui/datatables/endpoints-datatable/endpointsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    endpointManagement: '<',
    accessManagement: '<',
    removeAction: '<'
  }
});
