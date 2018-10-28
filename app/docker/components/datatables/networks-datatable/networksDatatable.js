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
    showOwnershipColumn: '<',
    showHostColumn: '<',
    removeAction: '<',
    offlineMode: '<'
  }
});
