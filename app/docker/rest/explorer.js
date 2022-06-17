angular.module('portainer.docker').factory('Explorer', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function ExplorerFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/explorer/:id/:action',
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        list: {
          method: 'POST',
          params: {
            id: '@id',
            action: 'list',
            path: '@path',
          },
          ignoreLoadingBar: true,
          isArray: true,
        },
      }
    );
  },
]);
