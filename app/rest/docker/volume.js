angular.module('portainer.rest')
.factory('Volume', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function VolumeFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/volumes/:id/:action',
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
