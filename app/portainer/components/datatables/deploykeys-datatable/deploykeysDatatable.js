angular.module('portainer.app').component('deploykeysDatatable', {
  templateUrl: 'app/portainer/components/datatables/deploykeys-datatable/deploykeysDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<'
  }
});
