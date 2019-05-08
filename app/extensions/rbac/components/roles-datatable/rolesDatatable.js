angular.module('portainer.extensions.rbac').component('rolesDatatable', {
  templateUrl: './rolesDatatable.html',
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
