angular.module('portainer.rest')
.factory('Stack', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function StackFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/stacks/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: { id: '@id' } },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST' },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
    getStackFile: { method: 'GET', params: { id : '@id', action: 'stackfile' } }
  });
}]);
