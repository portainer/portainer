angular.module('portainer.rest')
.factory('Network', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function NetworkFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/networks/:id/:action', {
    id: '@id',
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {method: 'GET', isArray: true},
    get: {method: 'GET'},
    create: {method: 'POST', params: {action: 'create'}, transformResponse: genericHandler},
    remove: { method: 'DELETE', transformResponse: genericHandler },
    connect: {method: 'POST', params: {action: 'connect'}},
    disconnect: {method: 'POST', params: {action: 'disconnect'}}
  });
}]);
