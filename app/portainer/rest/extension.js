angular.module('portainer.app')
.factory('Extension', ['$resource', 'API_ENDPOINT_EXTENSIONS',
 function ExtensionFactory($resource, API_ENDPOINT_EXTENSIONS) {
  'use strict';
  return $resource(API_ENDPOINT_EXTENSIONS + '/:id/:action', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    delete: { method: 'DELETE', params: { id: '@id' } },
    update: { method: 'POST', params: { id: '@id', action: 'update' } }
  });
}]);
