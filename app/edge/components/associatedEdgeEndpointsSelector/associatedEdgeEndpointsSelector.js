import angular from 'angular';
import controller from './associatedEdgeEndpointsSelector.controller';

angular.module('portainer.app').component('associatedEdgeEndpointsSelector', {
  templateUrl: './associatedEdgeEndpointsSelector.html',
  controller,
  bindings: {
    endpointIds: '<',
    tags: '<',
    groups: '<',
    hasBackendPagination: '<',

    onAssociate: '<',
    onDissociate: '<',
  },
});
