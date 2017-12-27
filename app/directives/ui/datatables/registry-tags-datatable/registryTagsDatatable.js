angular.module('ui').component('registryTagsDatatable', {
  templateUrl: 'app/directives/ui/datatables/registry-tags-datatable/registryTagsDatatable.html',
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
