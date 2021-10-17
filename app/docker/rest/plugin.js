angular.module('portainer.docker').factory('Plugin', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function PluginFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/plugins/:id/:action`,
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        query: { method: 'GET', isArray: true },
      }
    );
  },
]);
