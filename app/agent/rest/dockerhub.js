import angular from 'angular';

angular.module('portainer.agent').factory('AgentDockerhub', AgentDockerhub);

function AgentDockerhub($resource, $browser, API_ENDPOINT_ENDPOINTS) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/agent/:endpointType/v2/dockerhub/:registryId`,
    {},
    {
      limits: { method: 'GET', params: { registryId: '@registryId' } },
    }
  );
}
