angular.module('portainer.rest')
.factory('Swarm', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function SwarmFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/swarm', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: {method: 'GET'}
  });
}]);
