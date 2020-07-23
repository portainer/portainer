import angular from 'angular';

angular.module('portainer.agent').factory('Agent', AgentFactory);

function AgentFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, StateManager) {
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
