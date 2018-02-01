angular.module('portainer.docker')
.factory('Volume', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function VolumeFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/volumes/:id/:action',
  {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: { method: 'GET' },
    get: { method: 'GET', params: {id: '@id'} },
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler, ignoreLoadingBar: true},
    remove: {
      method: 'DELETE', transformResponse: genericHandler, params: {id: '@id'}
    }
  });
}]);
