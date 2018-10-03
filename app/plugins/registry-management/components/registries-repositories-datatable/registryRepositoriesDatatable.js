angular.module('portainer.plugins.registrymanagement').component('registryRepositoriesDatatable', {
  templateUrl: 'app/plugins/registry-management/components/registries-repositories-datatable/registryRepositoriesDatatable.html',
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
