import { API_ENDPOINT_ENDPOINTS } from '@/constants';
import { jsonObjectsToArrayHandler } from './response/handlers';

angular.module('portainer.docker').factory('Build', [
  '$resource',
  function BuildFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/build',
      {},
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
