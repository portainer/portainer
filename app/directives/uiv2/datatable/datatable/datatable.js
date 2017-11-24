angular.module('uiv2').component('datatable', {
  transclude: {
    actions: '?datatableActions',
    settings: '?datatableSettings'
  },
  templateUrl: 'app/directives/uiv2/datatable/datatable/datatable.html',
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
