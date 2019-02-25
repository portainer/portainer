angular.module('extension.storidge').component('storidgeNodesDatatable', {
  templateUrl: 'app/extensions/storidge/components/nodes-datatable/storidgeNodesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    cordonNodeAction: '<',
    uncordonNodeAction: '<'
  }
});
