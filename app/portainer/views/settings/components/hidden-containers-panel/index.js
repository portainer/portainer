import angular from 'angular';

import controller from './hidden-containers-panel.controller';

angular.module('portainer.app').component('hiddenContainersPanel', {
  templateUrl: './hidden-containers-panel.html',
  controller,
  bindings: {
    settings: '<',
    onSubmit: '<',
  },
});
