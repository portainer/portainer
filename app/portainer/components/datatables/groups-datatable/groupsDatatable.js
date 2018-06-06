angular.module('portainer.app').component('groupsDatatable', {
  templateUrl: 'app/portainer/components/datatables/groups-datatable/groupsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    accessManagement: '<',
    removeAction: '<'
  }
});
