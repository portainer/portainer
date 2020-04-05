import angular from 'angular';

angular.module('portainer.edge').component('edgeGroupsDatatable', {
  templateUrl: './groupsDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    dataset: '<',
    titleIcon: '@',
    tableKey: '@',
    orderBy: '@',
    removeAction: '<',
    updateAction: '<',
    reverseOrder: '<'
  }
});
