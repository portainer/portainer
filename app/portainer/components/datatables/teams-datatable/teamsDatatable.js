angular.module('portainer.app').component('teamsDatatable', {
  templateUrl: 'app/portainer/components/datatables/teams-datatable/teamsDatatable.html',
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
