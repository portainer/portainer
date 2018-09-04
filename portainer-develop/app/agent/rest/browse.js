angular.module('portainer.agent')
.factory('Browse', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function BrowseFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/browse/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    ls: {
      method: 'GET', isArray: true, params: { id: '@id', action: 'ls' }
    },
    get: {
      method: 'GET', params: { id: '@id', action: 'get' },
      transformResponse: browseGetResponse
    },
    delete: {
      method: 'DELETE', params: { id: '@id', action: 'delete' }
    },
    rename: {
      method: 'PUT', params: { id: '@id', action: 'rename' }
    }
  });
}]);
