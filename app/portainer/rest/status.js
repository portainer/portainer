angular.module('portainer.app').factory('Status', [
  '$resource',
  'API_ENDPOINT_STATUS',
  function StatusFactory($resource, API_ENDPOINT_STATUS) {
    'use strict';
    return $resource(
      API_ENDPOINT_STATUS + '/:action',
      {},
      {
        get: { method: 'GET' },
        version: { method: 'GET', params: { action: 'version' } },
      }
    );
  },
]);
