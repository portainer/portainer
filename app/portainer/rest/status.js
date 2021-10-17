angular.module('portainer.app').factory('Status', [
  '$resource',
  '$browser',
  'API_ENDPOINT_STATUS',
  function StatusFactory($resource, $browser, API_ENDPOINT_STATUS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_STATUS}/:action`,
      {},
      {
        get: { method: 'GET' },
        version: { method: 'GET', params: { action: 'version' } },
      }
    );
  },
]);
