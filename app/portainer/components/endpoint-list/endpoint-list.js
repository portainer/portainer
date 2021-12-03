angular.module('portainer.app').component('endpointList', {
  templateUrl: './endpointList.html',
  controller: 'EndpointListController',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    tags: '<',
    tableKey: '@',
    dashboardAction: '<',
    snapshotAction: '<',
    showSnapshotAction: '<',
    editAction: '<',
    isAdmin: '<',
    retrievePage: '<',
    endpointInitTime: '<',
  },
});
