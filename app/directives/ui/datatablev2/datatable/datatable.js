angular.module('uiv2').component('datatablev2', {
  transclude: {
    actions: '?datatableActions',
    settings: '?datatableSettings',
    content: 'td'
  },
  templateUrl: 'app/directives/ui/datatablev2/datatable/datatable.html',
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
