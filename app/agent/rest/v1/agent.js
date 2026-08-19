import angular from 'angular';

angular.module('portainer.agent').factory('AgentVersion1', AgentFactory);

function AgentFactory($resource, API_ENDPOINT_ENDPOINTS) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/agents`,
    {},
    {
      query: { method: 'GET', isArray: true },
    }
  );
}
