angular.module('portainer.extensions.registrymanagement').component('registriesRepositoryTagsDatatable', {
  templateUrl: './registriesRepositoryTagsDatatable.html',
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
