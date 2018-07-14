angular.module('portainer.docker').component('configsDatatable', {
  templateUrl: 'app/docker/components/datatables/configs-datatable/configsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showOwnershipColumn: '<',
    removeAction: '<'
  }
});
