angular.module('portainer.docker').component('networksDatatable', {
  templateUrl: 'app/docker/components/datatables/networks-datatable/networksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    showHostColumn: '<',
    removeAction: '<'
  }
});
