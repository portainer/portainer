angular.module('portainer.docker').factory('PodmanContainer', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function PodmanContainerFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/v4.0.2/libpod/containers/:id/:action',
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        top: {
          method: 'GET',
          params: { id: '@id', action: 'top' },
          ignoreLoadingBar: true,
          headers: { 'X-Podman-API': '1' },
        },
      }
    );
  },
]);
