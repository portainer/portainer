angular.module('portainer.app').factory('Settings', [
  '$resource',
  '$browser',
  'API_ENDPOINT_SETTINGS',
  function SettingsFactory($resource, $browser, API_ENDPOINT_SETTINGS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_SETTINGS}/:subResource/:action`,
      {},
      {
        get: { method: 'GET' },
        update: { method: 'PUT', ignoreLoadingBar: true },
        publicSettings: { method: 'GET', params: { subResource: 'public' }, ignoreLoadingBar: true },
        checkLDAPConnectivity: { method: 'PUT', params: { subResource: 'authentication', action: 'checkLDAP' } },
      }
    );
  },
]);
