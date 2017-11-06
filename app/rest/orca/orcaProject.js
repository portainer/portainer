angular.module('portainer.rest')
.factory('OrcaProject', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function OrcaProjectFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/orca/project/:id/:action/:driver', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', isArray: true, params: { id: '@id', action: 'status' } },
    create: { method: 'GET', params: { id: '@id', action: 'create', driver: '@driver' } },
  });
}]);
