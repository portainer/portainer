angular.module('portainer.app').factory('Motd', [
  '$resource',
  '$browser',
  'API_ENDPOINT_MOTD',
  function MotdFactory($resource, $browser, API_ENDPOINT_MOTD) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_MOTD}`,
      {},
      {
        get: {
          method: 'GET',
          ignoreLoadingBar: true,
        },
      }
    );
  },
]);
