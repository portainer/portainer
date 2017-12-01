angular.module('ui').component('containersDatatable', {
  templateUrl: 'app/directives/ui/datatables/containers-datatable/containersDatatable.html',
  controller: 'ContainersDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    swarmContainers: '<',
    publicUrl: '<',
    containerNameTruncateSize: '<',
    startAction: '<',
    stopAction: '<',
    killAction: '<',
    restartAction: '<',
    pauseAction: '<',
    resumeAction: '<',
    removeAction: '<'
  }
});
