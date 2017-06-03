angular.module('portainer.rest')
.factory('Registries', ['$resource', 'REGISTRIES_ENDPOINT', function RegistriesFactory($resource, REGISTRIES_ENDPOINT) {
  'use strict';
  return $resource(REGISTRIES_ENDPOINT + '/:id/:action', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
