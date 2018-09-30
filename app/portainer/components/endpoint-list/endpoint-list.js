angular.module('portainer.app').component('endpointList', {
  templateUrl: 'app/portainer/components/endpoint-list/endpointList.html',
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
