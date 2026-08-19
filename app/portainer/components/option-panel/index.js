import angular from 'angular';

import controller from './option-panel.controller.js';

angular.module('portainer.app').component('optionPanel', {
  templateUrl: './option-panel.html',
  controller,
  bindings: {
    ngModel: '<',
    explanation: '@',
    onChange: '<',
  },
});
