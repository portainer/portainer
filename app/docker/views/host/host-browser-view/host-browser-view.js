angular.module('portainer.docker').component('hostBrowserView', {
  templateUrl: './host-browser-view.html',
  controller: 'HostBrowserViewController',
  bindings: {
    endpoint: '<',
  },
});
