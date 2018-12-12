angular.module('portainer.extensions.registrymanagement').component('registriesRepositoryTagsDatatable', {
  templateUrl: 'app/extensions/registry-management/components/registries-repository-tags-datatable/registriesRepositoryTagsDatatable.html',
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
