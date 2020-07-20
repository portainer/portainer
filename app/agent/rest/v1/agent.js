import angular from 'angular';

angular.module('portainer.agent').factory('AgentVersion1', AgentFactory);

function AgentFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/agents`,
    {
      endpointId: EndpointProvider.endpointID,
    },
    {
      query: { method: 'GET', isArray: true },
    }
  );
}
