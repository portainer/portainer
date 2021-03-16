angular.module('portainer.app').component('registriesDatatable', {
  templateUrl: './registriesDatatable.html',
  controller: 'RegistriesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    accessManagement: '<',
    removeAction: '<',
    canBrowse: '<',
  },
});
