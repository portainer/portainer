angular.module('portainer.app').component('schedulesDatatable', {
  templateUrl: './schedulesDatatable.html',
  controller: 'SchedulesDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
  },
});
