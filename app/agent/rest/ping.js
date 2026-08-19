import angular from 'angular';

angular.module('portainer.agent').factory('AgentPing', AgentPingFactory);

function AgentPingFactory($resource, API_ENDPOINT_ENDPOINTS, $q) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/ping`,
    {},
    {
      ping: {
        method: 'GET',
        interceptor: {
          response: function versionInterceptor(response) {
            const instance = response.resource;
            const version = response.headers('Portainer-Agent-Api-Version') || 1;
            instance.version = Number(version);
            return instance;
          },
          responseError: function versionResponseError(error) {
            // 404 - agent is up - set version to 1
            if (error.status === 404) {
              return { version: 1 };
            }
            return $q.reject(error);
          },
        },
      },
    }
  );
}
