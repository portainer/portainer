angular.module('portainer.app').component('registryTagsDatatable', {
  templateUrl: 'app/portainer/components/datatables/registry-tags-datatable/registryTagsDatatable.html',
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
