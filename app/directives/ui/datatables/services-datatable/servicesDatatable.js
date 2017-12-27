angular.module('ui').component('servicesDatatable', {
  templateUrl: 'app/directives/ui/datatables/services-datatable/servicesDatatable.html',
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
    forceUpdateAction: '<'
  }
});
