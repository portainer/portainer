angular.module('portainer.integrations.storidge').component('storidgeSnapshotsDatatable', {
  templateUrl: './storidgeSnapshotsDatatable.html',
  controller: 'GenericDatatableController',
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
