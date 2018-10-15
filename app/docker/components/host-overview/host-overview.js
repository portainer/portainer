angular.module('portainer.docker').component('hostOverview', {
  templateUrl: 'app/docker/components/host-overview/host-overview.html',
  bindings: {
    hostDetails: '<',
    engineDetails: '<',
    devices: '<',
    disks: '<',
    isAgent: '<',
    refreshUrl: '@',
    browseUrl: '@',
    isAdmin: '<',
    jobs: '<'
  },
  transclude: true
});
