angular.module('portainer.docker').factory('Swarm', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function SwarmFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/swarm`,
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        get: { method: 'GET' },
      }
    );
  },
]);
