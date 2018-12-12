angular.module('portainer.docker').component('scheduleTasksDatatable', {
  templateUrl: 'app/portainer/components/datatables/schedule-tasks-datatable/scheduleTasksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    goToContainerLogs: '<'
  }
});
