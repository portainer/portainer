angular.module('portainer.rest')
.factory('Stack', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function StackFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/stacks/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    create: { method: 'POST' },
    get: { method: 'GET', params: { id: '@id' } },
    query: { method: 'GET', isArray: true },
    remove: { method: 'DELETE', params: { id: '@id'} },
    up: { method: 'POST', params: { id: '@id', action: 'up' } },
    down: { method: 'POST', params: { id: '@id', action: 'down' } },
    scale: { method: 'POST', params: { id: '@id', action: 'scale' } }
  });
}]);
