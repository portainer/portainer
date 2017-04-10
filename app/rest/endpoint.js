angular.module('portainer.rest')
.factory('Endpoints', ['$resource', 'ENDPOINTS_ENDPOINT', function EndpointsFactory($resource, ENDPOINTS_ENDPOINT) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:id/:action', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    updateAccess: { method: 'PUT', params: { id: '@id', action: 'access' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
  });
}]);
