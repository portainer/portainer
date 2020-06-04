import angular from 'angular';

import './edgeStackStatus.css';

angular.module('portainer.edge').component('edgeStackStatus', {
  templateUrl: './edgeStackStatus.html',
  controller: 'EdgeStackStatusController',
  bindings: {
    stackStatus: '<',
  },
});
