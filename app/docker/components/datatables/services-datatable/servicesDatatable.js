angular.module('portainer.docker').component('servicesDatatable', {
  templateUrl: 'app/docker/components/datatables/services-datatable/servicesDatatable.html',
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
    removeAction: '<',
    scaleAction: '<',
    swarmManagerIp: '<',
    forceUpdateAction: '<',
    showForceUpdateButton: '<'
  }
});
