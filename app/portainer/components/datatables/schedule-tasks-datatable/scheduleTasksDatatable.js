angular.module('portainer.docker').component('scheduleTasksDatatable', {
  templateUrl: './scheduleTasksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    goToContainerLogs: '<',
    getEdgeTaskLogs: '<'
  }
});
