angular.module('portainer.app').component('usersDatatable', {
  templateUrl: 'app/portainer/components/datatables/users-datatable/usersDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    authenticationMethod: '<'
  }
});
