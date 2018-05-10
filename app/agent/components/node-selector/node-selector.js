angular.module('portainer.agent').component('nodeSelector', {
  templateUrl: 'app/agent/components/node-selector/nodeSelector.html',
  controller: 'NodeSelectorController',
  bindings: {
    model: '='
  }
});
