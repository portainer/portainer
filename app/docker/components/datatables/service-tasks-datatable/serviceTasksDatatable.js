angular.module('portainer.docker').component('serviceTasksDatatable', {
  templateUrl: './serviceTasksDatatable.html',
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
    showTaskLogsButton: '<',
  },
});
