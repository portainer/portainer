angular.module('portainer.rest')
.factory('Secret', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function SecretFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/secrets/:id/:action', {
    endpointId: EndpointProvider.endpointID
  }, {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST', params: {action: 'create'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
