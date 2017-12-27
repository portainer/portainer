angular.module('ui').component('registryRepositoriesDatatable', {
  templateUrl: 'app/directives/ui/datatables/registry-repositories-datatable/registryRepositoriesDatatable.html',
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
    removeAction: '<',
    registryId: '<'
  }
});
