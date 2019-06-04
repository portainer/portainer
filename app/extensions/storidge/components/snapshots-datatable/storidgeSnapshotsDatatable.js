angular.module('extension.storidge').component('storidgeSnapshotsDatatable', {
  templateUrl: './storidgeSnapshotsDatatable.html',
  controller: 'StoridgeSnapshotsDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<'
  }
});
