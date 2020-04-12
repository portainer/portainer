angular.module('portainer.docker').component('tasksDatatable', {
  templateUrl: './tasksDatatable.html',
  controller: 'TasksDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    showSlotColumn: '<',
    showLogsButton: '<',
    agentProxy: '<',
  },
});
