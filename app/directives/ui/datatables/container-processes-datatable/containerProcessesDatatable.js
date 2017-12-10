angular.module('ui').component('containerProcessesDatatable', {
  templateUrl: 'app/directives/ui/datatables/container-processes-datatable/containerProcessesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '=',
    headerset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<'
  }
});
