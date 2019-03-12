angular.module('extension.storidge').component('storidgeDrivesDatatable', {
  templateUrl: 'app/extensions/storidge/components/drives-datatable/storidgeDrivesDatatable.html',
  controller: 'StoridgeDrivesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    addAction: '<',
    rescanAction: '<'
  }
});
