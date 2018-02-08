angular.module('portainer.app').component('registriesDatatable', {
  templateUrl: 'app/portainer/components/datatables/registries-datatable/registriesDatatable.html',
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
