angular.module('portainer.docker').component('tasksDatatable', {
  templateUrl: './tasksDatatable.html',
  controller: 'GenericDatatableController',
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
    agentProxy: '<'
  }
});
