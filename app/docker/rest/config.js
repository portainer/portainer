angular.module('portainer.docker').factory('Config', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  function ConfigFactory($resource, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:environmentId/docker/configs/:id/:action',
      {
        environmentId: '@environmentId',
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
