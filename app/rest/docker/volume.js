angular.module('portainer.rest')
.factory('Volume', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function VolumeFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/volumes/:id/:action',
  {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: { method: 'GET' },
    get: { method: 'GET', params: {id: '@id'} },
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
    remove: {
      method: 'DELETE', transformResponse: genericHandler, params: {id: '@id'}
    }
  });
}]);
