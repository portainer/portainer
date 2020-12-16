import angular from 'angular';

angular.module('portainer.agent').factory('AgentDockerhub', AgentDockerhub);

function AgentDockerhub($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, StateManager) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/:endpointType/v:version/dockerhub`,
    {
      version: StateManager.getAgentApiVersion,
    },
    {
      limits: { method: 'GET' },
    }
  );
}
