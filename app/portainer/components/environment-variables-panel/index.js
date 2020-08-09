import angular from 'angular';

import './environment-variables-panel.css';

import controller from './environment-variables-panel.controller.js';

angular.module('portainer.app').component('environmentVariablesPanel', {
  templateUrl: './environment-variables-panel.html',
  controller,
  bindings: {
    ngModel: '<',
    explanation: '@',
    onChange: '<',
  },
});
