angular.module('portainer.docker').component('logViewer', {
  templateUrl: 'app/docker/components/log-viewer/logViewer.html',
  controller: function logViewerController() {
    var ctrl = this;

    this.state = {
      autoScroll: true,
      search: ''
    };
  },
  bindings: {
    data: '='
  }
});
