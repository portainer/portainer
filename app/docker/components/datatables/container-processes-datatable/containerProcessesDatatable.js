angular.module('portainer.docker').component('containerProcessesDatatable', {
  templateUrl: 'app/docker/components/datatables/container-processes-datatable/containerProcessesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '=',
    headerset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<'
  }
});
