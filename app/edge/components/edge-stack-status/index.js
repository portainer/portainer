import angular from 'angular';

import { EdgeStackStatusController } from './edgeStackStatusController';
import './edgeStackStatus.css';

angular.module('portainer.edge').component('edgeStackStatus', {
  templateUrl: './edgeStackStatus.html',
  controller: EdgeStackStatusController,
  bindings: {
    stackStatus: '<',
  },
});
