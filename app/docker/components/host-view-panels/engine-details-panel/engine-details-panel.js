import angular from 'angular';

angular.module('portainer.docker').component('engineDetailsPanel', {
  templateUrl:
    'app/docker/components/host-view-panels/engine-details-panel/engine-details-panel.html',
  bindings: {
    engine: '<'
  }
});
