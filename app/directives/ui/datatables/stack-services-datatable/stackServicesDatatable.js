angular.module('ui').component('stackServicesDatatable', {
  templateUrl: 'app/directives/ui/datatables/stack-services-datatable/stackServicesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    publicURL: '<',
    showTextFilter: '<'
  }
});
