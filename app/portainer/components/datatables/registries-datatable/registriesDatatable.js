angular.module('portainer.app').component('registriesDatatable', {
  templateUrl: 'app/portainer/components/datatables/registries-datatable/registriesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    accessManagement: '<',
    removeAction: '<',
    registryManagement: '<'
  }
});
