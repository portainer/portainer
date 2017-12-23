angular.module('ui').component('eventsDatatable', {
  templateUrl: 'app/directives/ui/datatables/events-datatable/eventsDatatable.html',
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
