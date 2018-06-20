angular.module('portainer.app').component('stackServicesDatatable', {
  templateUrl: 'app/portainer/components/datatables/stack-services-datatable/stackServicesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    nodes: '<',
    scaleAction: '<',
    publicUrl: '<',
    showTextFilter: '<'
  }
});
