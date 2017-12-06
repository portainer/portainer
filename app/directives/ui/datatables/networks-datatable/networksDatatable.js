angular.module('ui').component('networksDatatable', {
  templateUrl: 'app/directives/ui/datatables/networks-datatable/networksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    removeAction: '<'
  }
});
