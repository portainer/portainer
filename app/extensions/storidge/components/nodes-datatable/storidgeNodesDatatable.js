import angular from 'angular';

angular.module('extension.storidge').component('storidgeNodesDatatable', {
  templateUrl: './storidgeNodesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    title: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<'
  }
});
