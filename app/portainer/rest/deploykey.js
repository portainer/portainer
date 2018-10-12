angular.module('portainer.app')
.factory('Deploykeys', ['$resource', 'API_ENDPOINT_DEPLOYKEYS', function DeploykeysFactory($resource, API_ENDPOINT_DEPLOYKEYS) {
  'use strict';
  return $resource(API_ENDPOINT_DEPLOYKEYS + '/:id/:entity/:entityId', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
