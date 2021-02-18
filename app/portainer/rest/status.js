const API_ENDPOINT_STATUS = 'api/status';

angular.module('portainer.app').factory('Status', [
  '$resource',
  function StatusFactory($resource) {
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
