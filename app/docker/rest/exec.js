import { genericHandler } from './response/handlers';

angular.module('portainer.docker').factory('Exec', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  function ExecFactory($resource, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:environmentId/docker/exec/:id/:action',
      {
        environmentId: '@environmentId',
      },
      {
        resize: {
          method: 'POST',
          params: { id: '@id', action: 'resize', h: '@height', w: '@width' },
          transformResponse: genericHandler,
          ignoreLoadingBar: true,
        },
      }
    );
  },
]);
