import angular from 'angular';

import { API_ENDPOINT_ENDPOINTS } from '@/constants';

angular.module('portainer.agent').factory('Agent', AgentFactory);

function AgentFactory($resource, EndpointProvider, StateManager) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/v:version/agents`,
    {
      endpointId: EndpointProvider.endpointID,
      version: StateManager.getAgentApiVersion,
    },
    {
      query: { method: 'GET', isArray: true },
    }
  );
}
