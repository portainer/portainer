import angular from 'angular';
import controller from './associatedEndpointsSelector.controller';

angular.module('portainer.app').component('associatedEndpointsSelector', {
  templateUrl: './associatedEndpointsSelector.html',
  controller,
  bindings: {
    endpointIds: '<',
    hasBackendPagination: '<',

    onAssociate: '<',
    onDissociate: '<',
  },
});
