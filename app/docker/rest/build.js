import { jsonObjectsToArrayHandler } from './response/handlers';

angular.module('portainer.docker').factory('Build', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function BuildFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/build',
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        buildImage: {
          method: 'POST',
          ignoreLoadingBar: true,
          transformResponse: jsonObjectsToArrayHandler,
          isArray: true,
          headers: { 'Content-Type': 'application/x-tar' },
        },
        buildImageOverride: {
          method: 'POST',
          ignoreLoadingBar: true,
          transformResponse: jsonObjectsToArrayHandler,
          isArray: true,
        },
      }
    );
  },
]);
