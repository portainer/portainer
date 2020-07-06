import angular from 'angular';

angular.module('portainer.edge').component('edgeStacksDatatable', {
  templateUrl: './edgeStacksDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    refreshCallback: '<',
  },
});
