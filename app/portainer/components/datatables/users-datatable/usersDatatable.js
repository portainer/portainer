angular.module('portainer.app').component('usersDatatable', {
  templateUrl: 'app/portainer/components/datatables/users-datatable/usersDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    showTextFilter: '<',
    removeAction: '<',
    authenticationMethod: '<'
  }
});
