angular.module('ui').component('nodeTasksDatatable', {
  templateUrl: 'app/directives/ui/datatables/node-tasks-datatable/nodeTasksDatatable.html',
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
