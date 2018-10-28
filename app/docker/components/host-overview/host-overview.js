angular.module('portainer.docker').component('hostOverview', {
  templateUrl: 'app/docker/components/host-overview/host-overview.html',
  bindings: {
    hostDetails: '<',
    engineDetails: '<',
    devices: '<',
    disks: '<',
    isAgent: '<',
    offlineMode: '<',
    agentApiVersion: '<',
    refreshUrl: '@',
    browseUrl: '@',
    jobUrl: '@',
    isJobEnabled: '<',
    jobs: '<'
  },
  transclude: true
});
