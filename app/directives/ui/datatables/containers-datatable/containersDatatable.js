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
    removeAction: '<',
    showIpAddressColumn: '<',
    showOwnershipColumn: '<',
    swarmContainers: '<',
    publicUrl: '<',
    containerNameTruncateSize: '<'
  }
});
