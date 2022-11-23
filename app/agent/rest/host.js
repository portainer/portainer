import angular from 'angular';

angular.module('portainer.agent').factory('Host', HostFactory);

function HostFactory($resource, API_ENDPOINT_ENDPOINTS, StateManager) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/v:version/host/:action`,
    {
      version: StateManager.getAgentApiVersion,
    },
    {
      info: { method: 'GET', params: { action: 'info' } },
    }
  );
}
