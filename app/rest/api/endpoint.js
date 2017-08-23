angular.module('portainer.rest')
.factory('Endpoints', ['$resource', 'API_ENDPOINT_ENDPOINTS', function EndpointsFactory($resource, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:id/:action', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    updateAccess: { method: 'PUT', params: { id: '@id', action: 'access' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
