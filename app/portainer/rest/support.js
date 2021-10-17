angular.module('portainer.app').factory('Support', [
  '$resource',
  '$browser',
  'API_ENDPOINT_SUPPORT',
  function SupportFactory($resource, $browser, API_ENDPOINT_SUPPORT) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_SUPPORT}`,
      {},
      {
        get: { method: 'GET', isArray: true },
      }
    );
  },
]);
