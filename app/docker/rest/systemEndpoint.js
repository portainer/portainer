angular.module('portainer.docker').factory('SystemEndpoint', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  function SystemEndpointFactory($resource, $browser, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/:action/:subAction`,
      {
        name: '@name',
      },
      {
        ping: {
          method: 'GET',
          params: { action: '_ping', endpointId: '@endpointId' },
        },
      }
    );
  },
]);
