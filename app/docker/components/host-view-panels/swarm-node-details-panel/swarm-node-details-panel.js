angular.module('portainer.docker').component('swarmNodeDetailsPanel', {
  templateUrl:
    'app/docker/components/host-view-panels/swarm-node-details-panel/swarm-node-details-panel.html',
  controller: 'SwarmNodeDetailsPanelController',
  bindings: {
    details: '<',
    onChangedLabels: '&'
  }
});
