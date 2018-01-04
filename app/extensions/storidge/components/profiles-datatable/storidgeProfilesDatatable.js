angular.module('extension.storidge').component('storidgeProfilesDatatable', {
  templateUrl: 'app/extensions/storidge/components/profiles-datatable/storidgeProfilesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<'
  }
});
