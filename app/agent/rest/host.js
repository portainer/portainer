angular.module('portainer.agent').factory('Host', [
  '$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function AgentFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/host/:action',
      {
        endpointId: EndpointProvider.endpointID
      },
      {
        info: { method: 'GET', isArray: false, params: { action: 'info' } }
      }
    );
  }
]);
