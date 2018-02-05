angular.module('portainer.app').component('registryRepositoriesDatatable', {
  templateUrl: 'app/portainer/components/datatables/registry-repositories-datatable/registryRepositoriesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    registryId: '<'
  }
});
