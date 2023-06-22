import angular from 'angular';

import controller from './hidden-containers-panel.controller';

angular.module('portainer.app').component('hiddenContainersPanelOld', {
  templateUrl: './hidden-containers-panel.html',
  controller,
  bindings: {
    settings: '<',
    onSubmit: '<',
  },
});
