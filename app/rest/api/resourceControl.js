angular.module('portainer.rest')
.factory('ResourceControl', ['$resource', 'RESOURCE_CONTROL_ENDPOINT', function ResourceControlFactory($resource, RESOURCE_CONTROL_ENDPOINT) {
  'use strict';
  return $resource(RESOURCE_CONTROL_ENDPOINT + '/:id', {}, {
    create: { method: 'POST' },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
