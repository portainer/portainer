angular.module('portainer.app').component('usersDatatable', {
  templateUrl: './usersDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    authenticationMethod: '<'
  }
});
