import angular from 'angular';

angular.module('portainer.edge').component('edgeJobsDatatable', {
  templateUrl: './edgeJobsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
  },
});
