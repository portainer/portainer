import angular from 'angular';
import AssociatedEndpointsSelectorController from './associatedEndpointsSelectorController';

angular.module('portainer.app').component('associatedEndpointsSelector', {
  templateUrl: './associatedEndpointsSelector.html',
  controller: AssociatedEndpointsSelectorController,
  bindings: {
    endpointIds: '<',
    tags: '<',
    groups: '<',
    hasBackendPagination: '<',

    onAssociate: '<',
    onDissociate: '<',
  },
});
