import angular from 'angular';

angular.module('extension.storidge').component('storidgeProfilesDatatable', {
  templateUrl: './storidgeProfilesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<'
  }
});
