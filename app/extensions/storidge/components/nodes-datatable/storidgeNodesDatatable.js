angular.module('extension.storidge').component('storidgeNodesDatatable', {
  templateUrl: './storidgeNodesDatatable.html',
  controller: 'StoridgeNodesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});
