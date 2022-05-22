import angular from 'angular';
import controller from './demo-feature-indicator.controller.js';

export const demoFeatureIndicator = {
  templateUrl: './demo-feature-indicator.html',
  controller,
  bindings: {
    content: '<',
  },
};

angular.module('portainer.app').component('demoFeatureIndicator', demoFeatureIndicator);
