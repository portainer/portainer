angular.module('portainer.edge').component('edgeJobTasksDatatable', {
  templateUrl: './edgeJobTasksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    getTaskLogs: '<',
  },
});
