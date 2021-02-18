const API_ENDPOINT_SUPPORT = 'api/support';

angular.module('portainer.app').factory('Support', [
  '$resource',
  function SupportFactory($resource) {
    'use strict';
    return $resource(
      API_ENDPOINT_SUPPORT,
      {},
      {
        get: { method: 'GET', isArray: true },
      }
    );
  },
]);
