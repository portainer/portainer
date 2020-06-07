import angular from 'angular';

angular.module('portainer.app').component('customTemplatesDatatable', {
  templateUrl: './customTemplatesDatatable.html',
  controller: 'GenericDatatableController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    accessManagement: '<',
    removeAction: '<',
  },
});
