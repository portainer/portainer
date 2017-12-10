angular.module('ui').component('tasksDatatable', {
  templateUrl: 'app/directives/ui/datatables/tasks-datatable/tasksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    showTextFilter: '<',
    showSlotColumn: '<'
  }
});
