import angular from 'angular';

import './status-indicator.css';

export const statusIndicator = {
  templateUrl: './status-indicator.html',
  bindings: {
    total: '<',
    ready: '<',
  },
};

angular.module('portainer.app').component('statusIndicator', statusIndicator);
