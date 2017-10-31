angular.module('portainer.rest')
.factory('Project', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function ProjectFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/projects/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: { id: '@id' } },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST' },
    update: { method: 'PUT', params: { id: '@id' } },
    remove: { method: 'DELETE', params: { id: '@id'} },
    getProjectFile: { method: 'GET', params: { id : '@id', action: 'projectfile' } }
  });
}]);
