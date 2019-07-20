angular.module('portainer.integrations.storidge').component('storidgeNodesDatatable', {
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
