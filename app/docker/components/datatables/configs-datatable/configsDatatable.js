angular.module('portainer.docker').component('configsDatatable', {
  templateUrl: 'app/docker/components/datatables/configs-datatable/configsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    removeAction: '<'
  }
});
