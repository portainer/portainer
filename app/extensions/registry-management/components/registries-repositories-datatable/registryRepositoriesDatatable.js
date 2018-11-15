angular.module('portainer.extensions.registrymanagement').component('registryRepositoriesDatatable', {
  templateUrl: 'app/extensions/registry-management/components/registries-repositories-datatable/registryRepositoriesDatatable.html',
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
