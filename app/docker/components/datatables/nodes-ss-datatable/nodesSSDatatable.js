angular.module('portainer.docker').component('nodesSsDatatable', {
  templateUrl: 'app/docker/components/datatables/nodes-ss-datatable/nodesSSDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<'
  }
});
