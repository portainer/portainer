angular.module('portainer.rest')
.factory('Task', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function TaskFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/tasks/:id', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} }
  });
}]);
