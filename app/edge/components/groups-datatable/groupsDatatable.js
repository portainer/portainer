import angular from 'angular';

angular.module('portainer.edge').component('edgeGroupsDatatable', {
  templateUrl: './groupsDatatable.html',
  controller: 'EdgeGroupsDatatableController',
  bindings: {
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
    updateAction: '<',
    reverseOrder: '<'
  }
});
