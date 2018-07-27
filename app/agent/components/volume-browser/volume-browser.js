angular.module('portainer.agent').component('volumeBrowser', {
  templateUrl: 'app/agent/components/volume-browser/volumeBrowser.html',
  controller: 'VolumeBrowserController',
  bindings: {
    volumeId: '<',
    nodeName: '<'
  }
});
