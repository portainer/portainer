angular.module('portainer.docker').component('containersDatatable', {
  templateUrl: 'app/docker/components/datatables/containers-datatable/containersDatatable.html',
  controller: 'ContainersDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showOwnershipColumn: '<',
    showHostColumn: '<',
    showAddAction: '<'
  }
});
