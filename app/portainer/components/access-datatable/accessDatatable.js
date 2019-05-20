angular.module('portainer.app').component('accessDatatable', {
  templateUrl: './accessDatatable.html',
  controller: 'AccessDatatableController',
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
