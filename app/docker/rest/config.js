angular.module('portainer.docker').factory('Config', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ConfigFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/configs/:id/:action`,
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
