angular.module('portainer.rest')
.factory('Events', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function EventFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/events', {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {
      method: 'GET', params: {since: '@since', until: '@until'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    }
  });
}]);
