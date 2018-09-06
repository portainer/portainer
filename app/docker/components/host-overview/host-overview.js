angular.module('portainer.docker').component('hostOverview', {
  templateUrl: 'app/docker/components/host-overview/host-overview.html',
  controller: 'HostOverviewController',
  bindings: {
    hostDetails: '<',
    engineDetails: '<',
    nodeDetails: '<',
    isAgent: '<'
  },
  transclude: true
});
