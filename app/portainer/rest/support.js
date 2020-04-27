angular.module('portainer.app').factory('Support', [
  '$resource',
  'API_ENDPOINT_SUPPORT',
  function SupportFactory($resource, API_ENDPOINT_SUPPORT) {
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
