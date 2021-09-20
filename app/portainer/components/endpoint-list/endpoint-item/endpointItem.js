import angular from 'angular';

import EndpointItemController from './endpoint-item-controller';

angular.module('portainer.app').component('endpointItem', {
  templateUrl: './endpointItem.html',
  bindings: {
    model: '<',
    onSelect: '<',
    onEdit: '<',
    isAdmin: '<',
    tags: '<',
    endpointInitTime: '<',
  },
  controller: EndpointItemController,
});
