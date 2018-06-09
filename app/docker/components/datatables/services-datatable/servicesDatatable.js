angular.module('portainer.docker').component('servicesDatatable', {
  templateUrl: 'app/docker/components/datatables/services-datatable/servicesDatatable.html',
  controller: 'ServicesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    agentProxy: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    showUpdateAction: '<',
    showAddAction: '<',
    showStackColumn: '<',
    showTaskLogsButton: '<'
  }
});
