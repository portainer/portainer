import angular from 'angular';

angular.module('portainer.agent').factory('Agent', AgentFactory);

function AgentFactory($resource, API_ENDPOINT_ENDPOINTS, StateManager) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/v:version/agents`,
    {
      version: StateManager.getAgentApiVersion,
    },
    {
      query: { method: 'GET', isArray: true },
    }
  );
}
