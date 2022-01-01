import { genericHandler } from './response/handlers';

angular.module('portainer.docker').factory('Network', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  'NetworksInterceptor',
  function NetworkFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, NetworksInterceptor) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/networks/:id/:action',
      {
        id: '@id',
        endpointId: EndpointProvider.endpointID,
      },
      {
        query: {
          method: 'GET',
          isArray: true,
          interceptor: NetworksInterceptor,
        },
        get: {
          method: 'GET',
        },
        create: {
          method: 'POST',
          params: { action: 'create' },
          transformResponse: genericHandler,
          ignoreLoadingBar: true,
        },
        remove: {
          method: 'DELETE',
          transformResponse: genericHandler,
        },
        connect: {
          method: 'POST',
          params: { action: 'connect' },
        },
        disconnect: {
          method: 'POST',
          params: { action: 'disconnect' },
        },
      }
    );
  },
]);
