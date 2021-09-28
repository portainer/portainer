import angular from 'angular';
import controller from './be-feature-indicator.controller.js';

import './be-feature-indicator.css';

export const beFeatureIndicator = {
  templateUrl: './be-feature-indicator.html',
  controller,
  bindings: {
    feature: '<',
  },
  transclude: true,
};

angular.module('portainer.app').component('beFeatureIndicator', beFeatureIndicator);
