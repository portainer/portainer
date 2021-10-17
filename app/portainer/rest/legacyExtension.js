// TODO: legacy extension management
angular.module('portainer.app').factory('LegacyExtensions', [
  '$resource',
  '$browser',
  'EndpointProvider',
  'API_ENDPOINT_ENDPOINTS',
  function LegacyExtensions($resource, $browser, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/extensions/:type`,
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        register: { method: 'POST' },
        deregister: { method: 'DELETE', params: { type: '@type' } },
      }
    );
  },
]);
