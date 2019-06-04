angular.module('portainer.app')
.factory('Roles', ['$resource', 'API_ENDPOINT_ROLES', function RolesFactory($resource, API_ENDPOINT_ROLES) {
  'use strict';
  return $resource(API_ENDPOINT_ROLES + '/:id', {}, {
    create: { method: 'POST', ignoreLoadingBar: true },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
