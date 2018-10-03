angular.module('portainer.plugins.registrymanagement').component('registriesRepositoryTagsDatatable', {
  templateUrl: 'app/plugins/registry-management/components/registries-repository-tags-datatable/registriesRepositoryTagsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    retagAction: '<'
  }
});
