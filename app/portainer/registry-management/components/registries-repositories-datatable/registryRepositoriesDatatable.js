angular.module('portainer.registrymanagement').component('registryRepositoriesDatatable', {
  templateUrl: './registryRepositoriesDatatable.html',
  controller: 'RegistryRepositoriesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    paginationAction: '<',
    loading: '<',
  },
});
