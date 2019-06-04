angular.module('extension.storidge').component('storidgeClusterEventsDatatable', {
  templateUrl: './storidgeClusterEventsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});
