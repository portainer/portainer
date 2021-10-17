angular.module('portainer.app').factory('Auth', [
  '$resource',
  '$browser',
  'API_ENDPOINT_AUTH',
  function AuthFactory($resource, $browser, API_ENDPOINT_AUTH) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_AUTH}/:action`,
      {},
      {
        login: { method: 'POST', ignoreLoadingBar: true },
        logout: { method: 'POST', params: { action: 'logout' }, ignoreLoadingBar: true },
      }
    );
  },
]);
