angular.module('portainer.docker').component('serviceTasksDatatable', {
  templateUrl: 'app/docker/components/datatables/service-tasks-datatable/serviceTasksDatatable.html',
  controller: 'ServiceTasksDatatableController',
  bindings: {
    dataset: '<',
    serviceId: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    agentProxy: '<',
    textFilter: '=',
    showTaskLogsButton: '<'
  }
});
