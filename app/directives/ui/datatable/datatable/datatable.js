angular.module('ui').component('datatable', {
  transclude: {
    actions: '?datatableActions',
    settings: '?datatableSettings'
  },
  templateUrl: 'app/directives/ui/datatable/datatable/datatable.html',
  controller: 'DatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    headers: '<',
    dataset: '<',
    datasetProperties: '<',
    rowActions: '<',
    orderBy: '@',
    reverseOrder: '<',
    identifier: '@',
    identifierProperty: '@',
    stateDetails: '@',
    tableKey: '@',
    showTextFilter: '<',
    selectableRows: '<',
    labelOn: '@',
    renderLabel: '<'
  }
});
