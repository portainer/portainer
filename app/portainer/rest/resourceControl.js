angular.module('portainer.app')
.factory('ResourceControl', ['$resource', 'API_ENDPOINT_RESOURCE_CONTROLS', function ResourceControlFactory($resource, API_ENDPOINT_RESOURCE_CONTROLS) {
  'use strict';
  return $resource(API_ENDPOINT_RESOURCE_CONTROLS + '/:id', {}, {
    create: { method: 'POST', ignoreLoadingBar: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
