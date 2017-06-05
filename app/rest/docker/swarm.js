angular.module('portainer.rest')
.factory('Swarm', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function SwarmFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/swarm', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: {method: 'GET'}
  });
}]);
