angular.module('portainer.agent').component('nodeSelector', {
  templateUrl: './nodeSelector.html',
  controller: 'NodeSelectorController',
  bindings: {
    model: '='
  }
});
