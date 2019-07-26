angular.module('portainer.app').component('endpointList', {
  templateUrl: './endpointList.html',
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
    isAdmin:'<',
    totalCount: '<',
    retrievePage: '<'
  }
});
