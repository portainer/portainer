angular.module('portainer.docker').factory('SystemEndpoint', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  function SystemEndpointFactory($resource, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/:action/:subAction',
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
