angular.module('portainer.app').component('endpointsSnapshotDatatable', {
  templateUrl: 'app/portainer/components/datatables/endpoints-snapshot-datatable/endpointsSnapshotDatatable.html',
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
