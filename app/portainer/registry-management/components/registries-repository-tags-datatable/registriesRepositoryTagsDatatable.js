angular.module('portainer.registrymanagement').component('registriesRepositoryTagsDatatable', {
  templateUrl: './registriesRepositoryTagsDatatable.html',
  controller: 'RegistryRepositoriesTagsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    retagAction: '<',
    advancedFeaturesAvailable: '<',
    paginationAction: '<',
    loading: '<',
  },
});
