angular.module('portainer.agent').component('volumeBrowser', {
  templateUrl: './volumeBrowser.html',
  controller: 'VolumeBrowserController',
  bindings: {
    volumeId: '<',
    nodeName: '<',
    isUploadEnabled: '<'
  }
});
