import angular from 'angular';

angular.module('portainer.edge').component('edgeJobsDatatable', {
  templateUrl: './edgeJobsDatatable.html',
  controller: 'EdgeJobsDatatableController',
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
