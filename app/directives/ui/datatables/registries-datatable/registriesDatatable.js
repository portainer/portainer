angular.module('ui').component('registriesDatatable', {
  templateUrl: 'app/directives/ui/datatables/registries-datatable/registriesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    accessManagement: '<',
    removeAction: '<'
  }
});
