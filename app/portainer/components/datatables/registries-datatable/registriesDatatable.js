angular.module('portainer.app').component('registriesDatatable', {
  templateUrl: './registriesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    accessManagement: '<',
    removeAction: '<',
    registryManagement: '<',
    canBrowse: '<'
  }
});
