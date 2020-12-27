import angular from 'angular';

angular.module('portainer.agent').factory('AgentDockerhub', AgentDockerhub);

function AgentDockerhub($resource, API_ENDPOINT_ENDPOINTS) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/:endpointType/v2/dockerhub`,
    {},
    {
      limits: { method: 'GET' },
    }
  );
}
