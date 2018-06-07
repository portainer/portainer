angular.module('portainer.docker').component('servicesDatatablee', {
  templateUrl: 'app/docker/components/datatables/services-datatable2/servicesDatatable.html',
  controller: 'ServiceDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    showOwnershipColumn: '<',
    removeAction: '<',
    scaleAction: '<',
    publicUrl: '<',
    forceUpdateAction: '<',
    showForceUpdateButton: '<',
    showAddAction: '<',
    showStackColumn: '<',
    nodes: '<',
    agentProxy: '<'
  }
});
