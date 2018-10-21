angular.module('portainer.agent').factory('AgentPing', [
  '$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', '$q',
  function AgentPingFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, $q) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/ping',
      { endpointId: EndpointProvider.endpointID },
      {
        ping: {
          method: 'GET',
          interceptor: {
            response: function versionInterceptor(response) {
              var instance = response.resource;
              var version =
                response.headers('Portainer-Agent-Api-Version') || 1;
              instance.version = Number(version);
              return instance;
            },
            responseError: function versionResponseError(error) {
              // 404 - agent is up - set version to 1
              if (error.status === 404) {
                return { version: 1 };
              }
              return $q.reject(error);
            }
          }
        }
      }
    );
  }
]);
