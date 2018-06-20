angular.module('portainer.azure').component('containergroupsDatatable', {
  templateUrl: 'app/azure/components/datatables/containergroups-datatable/containerGroupsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<'
  }
});
