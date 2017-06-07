angular.module('portainer.rest')
.factory('Info', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function InfoFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/info', {
    endpointId: EndpointProvider.endpointID
  });
}]);
