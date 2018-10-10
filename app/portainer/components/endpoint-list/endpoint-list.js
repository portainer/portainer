import angular from 'angular';
import template from './endpointList.html'
angular.module('portainer.app').component('endpointList', {
  templateUrl: template,
  controller: 'EndpointListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    endpoints: '<',
    dashboardAction: '<',
    snapshotAction: '<',
    showSnapshotAction: '<',
    editAction: '<',
    isAdmin:'<'
  }
});
