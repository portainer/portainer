angular.module('portainer.docker').component('hostDetailsPanel', {
  templateUrl: './host-details-panel.html',
  bindings: {
    host: '<',
    isJobEnabled: '<',
    isBrowseEnabled: '<',
    browseUrl: '@',
    jobUrl: '@'
  }
});
