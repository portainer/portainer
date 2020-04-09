angular.module('portainer.docker').component('hostOverview', {
  templateUrl: './host-overview.html',
  bindings: {
    hostDetails: '<',
    engineDetails: '<',
    engineLabels: '<',
    devices: '<',
    disks: '<',
    isAgent: '<',
    offlineMode: '<',
    agentApiVersion: '<',
    refreshUrl: '@',
    browseUrl: '@',
    jobUrl: '@',
    isJobEnabled: '<',
    hostFeaturesEnabled: '<',
    jobs: '<'
  },
  transclude: true
});
