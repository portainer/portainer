angular.module('portainer.rest')
.factory('CloudNode', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function CloudNodeFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/cloud/:resource/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    start: {method: 'GET', params: {id: '@id', action: 'start', resource: 'node'}},
    stop: {method: 'GET', params: {id: '@id', action: 'stop', resource: 'node'}},
    state: {method: 'GET', params: {id: '@id', action: 'state', resource: 'node'}},
  });
}]);
