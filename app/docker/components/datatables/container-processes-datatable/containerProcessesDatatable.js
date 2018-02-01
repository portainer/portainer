angular.module('portainer.docker').component('containerProcessesDatatable', {
  templateUrl: 'app/docker/components/datatables/container-processes-datatable/containerProcessesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '=',
    headerset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<'
  }
});
