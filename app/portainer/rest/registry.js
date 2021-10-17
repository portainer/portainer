angular.module('portainer.app').factory('Registries', [
  '$resource',
  '$browser',
  'API_ENDPOINT_REGISTRIES',
  function RegistriesFactory($resource, $browser, API_ENDPOINT_REGISTRIES) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_REGISTRIES}/:id/:action`,
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id', action: '', endpointId: '@endpointId' } },
        update: { method: 'PUT', params: { id: '@id' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
        configure: { method: 'POST', params: { id: '@id', action: 'configure' } },
      }
    );
  },
]);
