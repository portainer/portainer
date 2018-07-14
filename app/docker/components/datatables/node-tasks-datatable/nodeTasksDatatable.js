angular.module('portainer.docker').component('nodeTasksDatatable', {
  templateUrl: 'app/docker/components/datatables/node-tasks-datatable/nodeTasksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});
