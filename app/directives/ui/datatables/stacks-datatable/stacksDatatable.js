angular.module('ui').component('stacksDatatable', {
  templateUrl: 'app/directives/ui/datatables/stacks-datatable/stacksDatatable.html',
  controller: 'StacksDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    removeAction: '<',
    displayExternalStacks: '<'
  }
});
