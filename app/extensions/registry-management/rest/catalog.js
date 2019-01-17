angular.module('portainer.extensions.registrymanagement')
.factory('RegistryCatalog', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryCatalogFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/:action', {},
  {
    get: {
      method: 'GET',
      params: { id: '@id', action: '_catalog' },
      interceptor: {
        response: function versionInterceptor(response) {
          var instance = response.data;
          var link = response.headers('link');
          if (link) {
            instance.last = _.split(_.split(link, 'last=')[1], />|&/)[0];
            instance.n = _.split(_.split(link, /\?n=|&n=/)[1], />|&/)[0];
          }
          return instance;
        }
      }
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
