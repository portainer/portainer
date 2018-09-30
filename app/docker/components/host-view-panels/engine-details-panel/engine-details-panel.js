angular.module('portainer.docker').component('engineDetailsPanel', {
  templateUrl:
    'app/docker/components/host-view-panels/engine-details-panel/engine-details-panel.html',
  controller: 'EngineDetailsPanelController',
  bindings: {
    engine: '<'
  }
});
