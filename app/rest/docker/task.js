angular.module('portainer.rest')
.factory('Task', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function TaskFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/tasks/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} },
    logs: {
        method: 'GET',
        params: {
            action: 'logs',
            stdout: '@stdout' || 0,
            stderr: '@stderr' || 0,
            timestamps: '@timestamps' || 0,
            tail: '@tail' || 'all'
        },
        transformResponse: genericHandler
    }
  });
}]);
