import angular from 'angular';

import { NodeSelectorController } from './nodeSelectorController';

angular.module('portainer.agent').component('nodeSelector', {
  templateUrl: './nodeSelector.html',
  controller: NodeSelectorController,
  bindings: {
    model: '=',
    endpointId: '<',
  },
});
