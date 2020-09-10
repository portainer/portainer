import linkGetResponse from './transform/linkGetResponse';

angular.module('portainer.registrymanagement').factory('RegistryCatalog', [
  '$resource',
  'API_ENDPOINT_REGISTRIES',
  function RegistryCatalogFactory($resource, API_ENDPOINT_REGISTRIES) {
    'use strict';
    return $resource(
      API_ENDPOINT_REGISTRIES + '/:id/v2/:action',
      {},
      {
        get: {
          method: 'GET',
          params: { id: '@id', action: '_catalog' },
          transformResponse: linkGetResponse,
        },
        ping: {
          method: 'GET',
          params: { id: '@id' },
        },
        pingWithForceNew: {
          method: 'GET',
          params: { id: '@id' },
          headers: { 'X-RegistryManagement-ForceNew': '1' },
        },
      },
      {
        stripTrailingSlashes: false,
      }
    );
  },
]);
