angular.module('ui').component('teamsDatatable', {
  templateUrl: 'app/directives/ui/datatables/teams-datatable/teamsDatatable.html',
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
