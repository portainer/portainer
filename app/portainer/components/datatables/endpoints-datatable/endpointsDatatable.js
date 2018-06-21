angular.module('portainer.app').component('endpointsDatatable', {
  templateUrl: 'app/portainer/components/datatables/endpoints-datatable/endpointsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    endpointManagement: '<',
    accessManagement: '<',
    removeAction: '<'
  }
});
