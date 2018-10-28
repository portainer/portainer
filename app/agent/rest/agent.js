import angular from 'angular';

angular.module('portainer.agent')
.factory('Agent', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'StateManager',
  function AgentFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, StateManager) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/v:version/agents', {
    endpointId: EndpointProvider.endpointID,
    version: StateManager.getAgentApiVersion
  },
  {
    query: { method: 'GET', isArray: true }
  });
}]);
