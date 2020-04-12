angular.module('portainer.docker').component('swarmNodeDetailsPanel', {
  templateUrl: './swarm-node-details-panel.html',
  controller: 'SwarmNodeDetailsPanelController',
  bindings: {
    details: '<',
    originalNode: '<',
  },
});
