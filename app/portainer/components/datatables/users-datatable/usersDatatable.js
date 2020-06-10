import angular from 'angular';
import UsersDatatableController from './usersDatatableController';

angular.module('portainer.app').component('usersDatatable', {
  templateUrl: './usersDatatable.html',
  controller: UsersDatatableController,
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    removeAction: '<',
    authenticationMethod: '<',
  },
});
