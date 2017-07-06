angular.module('portainer.rest')
.factory('Stack', ['$resource', 'EndpointProvider', 'ENDPOINTS_ENDPOINT', function StackFactory($resource, EndpointProvider, ENDPOINTS_ENDPOINT) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/stacks/:id/:action', {
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
