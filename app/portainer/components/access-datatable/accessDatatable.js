angular.module('portainer.app').component('accessDatatable', {
  templateUrl: './accessDatatable.html',
  controller: 'AccessDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    roles: '<',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
    updateAction: '<',
    reverseOrder: '<',
    inheritFrom: '<',
  },
});
