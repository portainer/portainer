angular.module('ui').component('nodesSsDatatable', {
  templateUrl: 'app/directives/ui/datatables/nodes-ss-datatable/nodesSSDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<'
  }
});
