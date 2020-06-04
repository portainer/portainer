angular.module('portainer.docker').factory('Plugin', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function PluginFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/plugins/:id/:action',
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        query: { method: 'GET', isArray: true },
      }
    );
  },
]);
