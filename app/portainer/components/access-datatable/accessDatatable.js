angular.module('portainer.app').component('accessDatatable', {
  templateUrl: './accessDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
    reverseOrder: '<',
    rbacEnabled: '<',
    inheritFrom: '<'
  }
});
