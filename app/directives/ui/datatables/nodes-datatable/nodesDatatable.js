angular.module('ui').component('nodesDatatable', {
  templateUrl: 'app/directives/ui/datatables/nodes-datatable/nodesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showIpAddressColumn: '<',
    accessToNodeDetails: '<'
  }
});
