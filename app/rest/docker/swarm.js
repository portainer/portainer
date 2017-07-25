angular.module('portainer.rest')
.factory('Swarm', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function SwarmFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/swarm', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: {method: 'GET'}
  });
}]);
