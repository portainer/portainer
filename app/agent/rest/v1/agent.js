import angular from 'angular';

angular.module('portainer.agent').factory('AgentVersion1', AgentFactory);

function AgentFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/agents`,
    {
      endpointId: EndpointProvider.endpointID,
    },
    {
      query: { method: 'GET', isArray: true },
    }
  );
}
