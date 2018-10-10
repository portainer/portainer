angular.module('portainer.docker').component('hostOverview', {
  templateUrl: './host-overview.html',
  bindings: {
    hostDetails: '<',
    engineDetails: '<',
    devices: '<',
    disks: '<',
    isAgent: '<',
    refreshUrl: '@'
  },
  transclude: true
});
