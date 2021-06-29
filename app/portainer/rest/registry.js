import angular from 'angular';

import { API_ENDPOINT_REGISTRIES } from '@/constants';

angular.module('portainer.app').factory('Registries', [
  '$resource',
  function RegistriesFactory($resource) {
    return $resource(
      `${API_ENDPOINT_REGISTRIES}/:id/:action`,
      {},
      {
        create: { method: 'POST', ignoreLoadingBar: true },
        query: { method: 'GET', isArray: true },
        get: { method: 'GET', params: { id: '@id' } },
        update: { method: 'PUT', params: { id: '@id' } },
        updateAccess: { method: 'PUT', params: { id: '@id', action: 'access' } },
        remove: { method: 'DELETE', params: { id: '@id' } },
        configure: { method: 'POST', params: { id: '@id', action: 'configure' } },
      }
    );
  },
]);
