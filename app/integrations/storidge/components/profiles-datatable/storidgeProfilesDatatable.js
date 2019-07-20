angular.module('portainer.integrations.storidge').component('storidgeProfilesDatatable', {
  templateUrl: './storidgeProfilesDatatable.html',
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
