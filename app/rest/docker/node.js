angular.module('portainer.rest')
.factory('Node', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function NodeFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/nodes/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {method: 'GET', isArray: true},
    get: {method: 'GET', params: {id: '@id'}},
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
