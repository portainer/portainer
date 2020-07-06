import angular from 'angular';

import { AssociatedEndpointsDatatableController } from './associatedEndpointsDatatableController';

angular.module('portainer.edge').component('associatedEndpointsDatatable', {
  templateUrl: './associatedEndpointsDatatable.html',
  controller: AssociatedEndpointsDatatableController,
  bindings: {
    titleText: '@',
    titleIcon: '@',
    tableKey: '@',
    orderBy: '@',
    reverseOrder: '<',
    retrievePage: '<',
    updateKey: '<',
  },
});
