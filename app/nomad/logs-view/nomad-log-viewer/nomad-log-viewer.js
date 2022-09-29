angular.module('portainer.nomad').component('nomadLogViewer', {
  templateUrl: './nomadLogViewer.html',
  controller: 'NomadLogViewerController',
  bindings: {
    stderrLog: '<',
    stdoutLog: '<',
    resourceName: '<',
    logCollectionChange: '<',
  },
});
