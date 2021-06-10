import angular from 'angular';
import controller from './environment-variables-simple-mode-item.controller.js';

export const environmentVariablesSimpleModeItem = {
  templateUrl: './environment-variables-simple-mode-item.html',
  controller,

  bindings: {
    variable: '<',
    index: '<',

    onChange: '<',
    onRemove: '<',
  },
};

angular.module('portainer.app').component('environmentVariablesSimpleModeItem', environmentVariablesSimpleModeItem);
