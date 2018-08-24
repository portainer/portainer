angular.module('portainer.app')
  .factory('RegistryCatalog', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryCatalogFactory($resource, API_ENDPOINT_REGISTRIES) {
    'use strict';
    return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/_catalog', {}, {
      get: {
        method: 'GET',
        params: {
          id: '@id'
        }
      }
    });
  }]);