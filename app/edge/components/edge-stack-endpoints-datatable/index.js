import angular from 'angular';

import { EdgeStackEndpointsDatatableController } from './edgeStackEndpointsDatatableController';

angular.module('portainer.edge').component('edgeStackEndpointsDatatable', {
  templateUrl: './edgeStackEndpointsDatatable.html',
  controller: EdgeStackEndpointsDatatableController,
  bindings: {
    titleText: '@',
    titleIcon: '@',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    retrievePage: '<',
  },
});
