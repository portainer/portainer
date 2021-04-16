angular.module('portainer.app').component('rolesDatatable', {
  templateUrl: './rolesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
  },
});
