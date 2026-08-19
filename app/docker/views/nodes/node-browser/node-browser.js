angular.module('portainer.docker').component('nodeBrowserView', {
  templateUrl: './node-browser.html',
  controller: 'NodeBrowserController',
  bindings: {
    endpoint: '<',
  },
});
