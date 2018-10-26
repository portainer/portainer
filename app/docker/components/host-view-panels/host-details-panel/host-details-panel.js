angular.module('portainer.docker').component('hostDetailsPanel', {
  templateUrl:
    'app/docker/components/host-view-panels/host-details-panel/host-details-panel.html',
  bindings: {
    host: '<',
    isAgent: '<',
    jobCapability: '<',
    browseUrl: '@'
  }
});
