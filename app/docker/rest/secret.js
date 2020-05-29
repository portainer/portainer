angular.module('portainer.docker').factory('Secret', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function SecretFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/secrets/:id/:action',
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        get: { method: 'GET', params: { id: '@id' } },
        query: { method: 'GET', isArray: true },
        create: { method: 'POST', params: { action: 'create' }, ignoreLoadingBar: true },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
