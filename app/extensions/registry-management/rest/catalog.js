angular.module('portainer.extensions.registrymanagement')
.factory('RegistryCatalog', ['$resource', 'API_ENDPOINT_REGISTRIES', 'RegistryAPILinkInterceptor',
function RegistryCatalogFactory($resource, API_ENDPOINT_REGISTRIES, RegistryAPILinkInterceptor) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/:action', {},
  {
    get: {
      method: 'GET',
      params: { id: '@id', action: '_catalog' },
      interceptor: RegistryAPILinkInterceptor
    },
    ping: {
      method: 'GET',
      params: { id: '@id' }, timeout: 3500
    },
    pingWithForceNew: {
      method: 'GET',
      params: { id: '@id' }, timeout: 3500,
      headers: { 'X-RegistryManagement-ForceNew': '1' }
    }
  },
  {
    stripTrailingSlashes: false
  });
}]);
