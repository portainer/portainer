angular.module('portainer.app').component('stackServicesDatatable', {
  templateUrl: 'app/portainer/components/datatables/stack-services-datatable/stackServicesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    publicUrl: '<',
    showTextFilter: '<'
  }
});
