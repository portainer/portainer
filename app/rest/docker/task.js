angular.module('portainer.rest')
.factory('Task', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function TaskFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/tasks/:id', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} }
  });
}]);
