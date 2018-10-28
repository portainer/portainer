import angular from 'angular';

angular.module('portainer.agent').factory('Host', [
  '$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'StateManager',
  function AgentFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, StateManager) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/v:version/host/:action',
      {
        endpointId: EndpointProvider.endpointID,
        version: StateManager.getAgentApiVersion
      },
      {
        info: { method: 'GET', params: { action: 'info' } }
      }
    );
  }
]);
