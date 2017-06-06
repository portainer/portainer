angular.module('portainer.rest')
.factory('Service', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function ServiceFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/services/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST', params: {action: 'create'} },
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
