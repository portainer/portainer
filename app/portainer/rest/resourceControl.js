export const API_ENDPOINT_RESOURCE_CONTROLS = 'api/resource_controls';

angular.module('portainer.app').factory('ResourceControl', [
  '$resource',
  function ResourceControlFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_RESOURCE_CONTROLS + '/:id',
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        get: { method: 'GET', params: { id: '@id' } },
        update: { method: 'PUT', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
