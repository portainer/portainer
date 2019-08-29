angular.module('portainer.extensions.registrymanagement').component('registryRepositoriesDatatable', {
  templateUrl: './registryRepositoriesDatatable.html',
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
