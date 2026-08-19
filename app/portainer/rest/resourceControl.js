angular.module('portainer.app').factory('ResourceControl', [
  '$resource',
  'API_ENDPOINT_RESOURCE_CONTROLS',
  function ResourceControlFactory($resource, API_ENDPOINT_RESOURCE_CONTROLS) {
    'use strict';
    return $resource(
      API_ENDPOINT_RESOURCE_CONTROLS + '/:id',
      {},
      {
        update: { method: 'PUT', params: { id: '@id' } },
      }
    );
  },
]);
