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
    render: '<',
    datasetFields: '<',
    orderBy: '@',
    identifier: '@',
    identifierField: '@',
    stateDetails: '@',
    tableKey: '@',
    showTextFilter: '<',
    selectableRows: '<'
  }
});
