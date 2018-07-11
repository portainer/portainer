angular.module('portainer.docker').component('tasksDatatable', {
  templateUrl: 'app/docker/components/datatables/tasks-datatable/tasksDatatable.html',
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
