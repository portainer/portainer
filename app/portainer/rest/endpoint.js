angular.module('portainer.app')
.factory('Endpoints', ['$resource', 'API_ENDPOINT_ENDPOINTS', function EndpointsFactory($resource, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:id/:action', {}, {
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    updateAccess: { method: 'PUT', params: { id: '@id', action: 'access' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
    snapshot: { method: 'POST', params: { id: 'snapshot' }},
    executeJob: { method: 'POST', ignoreLoadingBar: true, params: { id: '@id', action: 'job' } }
  });
}]);
