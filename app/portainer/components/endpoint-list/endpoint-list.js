import template from './endpointList.html'
angular.module('portainer.app').component('endpointList', {
  templateUrl: template,
  controller: 'EndpointListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    endpoints: '<',
    tableKey: '@',
    dashboardAction: '<',
    snapshotAction: '<',
    showSnapshotAction: '<',
    editAction: '<',
    isAdmin:'<'
  }
});
