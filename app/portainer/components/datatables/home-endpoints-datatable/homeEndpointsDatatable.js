angular.module('portainer.app').component('homeEndpointsDatatable', {
  templateUrl: 'app/portainer/components/datatables/home-endpoints-datatable/homeEndpointsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    dashboardAction: '<'
  }
});
