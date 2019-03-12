angular.module('extension.storidge').component('storidgeNodesDatatable', {
  templateUrl: 'app/extensions/storidge/components/nodes-datatable/storidgeNodesDatatable.html',
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
