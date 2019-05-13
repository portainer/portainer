angular.module('portainer.extensions.rbac').component('accessDatatable', {
  templateUrl: './accessDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    rbacEnabled: '<'
  }
});
