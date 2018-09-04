angular.module('portainer.app')
.factory('Deploykeys', ['$resource', 'API_ENDPOINT_KEYS', function DeploykeysFactory($resource, API_ENDPOINT_KEYS) {
  'use strict';
  return $resource(API_ENDPOINT_KEYS + '/:id', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
