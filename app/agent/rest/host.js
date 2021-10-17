import angular from 'angular';

angular.module('portainer.agent').factory('Host', HostFactory);

function HostFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider, StateManager) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/v:version/host/:action`,
    {
      endpointId: EndpointProvider.endpointID,
      version: StateManager.getAgentApiVersion,
    },
    {
      info: { method: 'GET', params: { action: 'info' } },
    }
  );
}
