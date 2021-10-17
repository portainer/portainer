angular.module('portainer.docker').factory('Secret', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function SecretFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/secrets/:id/:action`,
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
