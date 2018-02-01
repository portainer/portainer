angular.module('portainer.docker').component('containersDatatable', {
  templateUrl: 'app/docker/components/datatables/containers-datatable/containersDatatable.html',
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
