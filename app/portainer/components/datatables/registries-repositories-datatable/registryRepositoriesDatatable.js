angular.module('portainer.docker').component('registryRepositoriesDatatable', {
  templateUrl: 'app/portainer/components/datatables/registries-repositories-datatable/registryRepositoriesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<'
  }
});
