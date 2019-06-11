angular.module('portainer.integrations.storidge').component('storidgeClusterEventsDatatable', {
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
