angular.module('extension.storidge').component('storidgeSnapshotsDatatable', {
  templateUrl: 'app/extensions/storidge/components/snapshots-datatable/storidgeSnapshotsDatatable.html',
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
