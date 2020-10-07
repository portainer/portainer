angular.module('portainer.rbac').component('rolesDatatable', {
  templateUrl: './rolesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
  },
});
