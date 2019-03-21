angular.module('extension.storidge').component('storidgeClusterEventsDatatable', {
  templateUrl: './storidgeClusterEventsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});
