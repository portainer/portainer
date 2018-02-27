angular.module('portainer.docker').component('logViewer', {
  templateUrl: 'app/docker/components/log-viewer/logViewer.html',
  controller: 'LogViewerController',
  bindings: {
    data: '=',
    logCollectionChange: '<'
  }
});
