angular.module('portainer.app').factory('Settings', [
  '$resource',
  'API_ENDPOINT_SETTINGS',
  function SettingsFactory($resource, API_ENDPOINT_SETTINGS) {
    'use strict';
    return $resource(
      API_ENDPOINT_SETTINGS + '/:subResource/:action',
      {},
      {
        update: { method: 'PUT', ignoreLoadingBar: true },
      }
    );
  },
]);
