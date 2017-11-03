angular.module('portainer.rest')
.factory('Deployment', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function DeploymentFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/orca/stack/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', isArray: true, params: { id: '@id', action: 'status' } },
    render: { method: 'GET', params: { id: '@id', action: 'render' } },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST' },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
