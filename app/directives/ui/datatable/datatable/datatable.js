angular.module('ui').component('datatable', {
  transclude: {
    actions: '?datatableActions'
  },
  templateUrl: 'app/ui/components/datatable/datatable/datatable.html',
  controller: 'DatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    headers: '<',
    dataset: '<',
    datasetFields: '<',
    orderBy: '@',
    identifier: '@',
    identifierField: '@',
    stateDetails: '@',
    tableKey: '@',
    showFilter: '<',
    showSettings: '<'
  }
});
