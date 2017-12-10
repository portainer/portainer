angular.module('ui').component('usersDatatable', {
  templateUrl: 'app/directives/ui/datatables/users-datatable/usersDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<'
  }
});
