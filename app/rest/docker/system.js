angular.module('portainer.rest')
.factory('System', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function SystemFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/:action', {
    name: '@name',
    endpointId: EndpointProvider.endpointID
  },
  {
    info: { method: 'GET', params: { action: 'info' } },
    version: { method: 'GET', params: { action: 'version' } },
    events: {
      method: 'GET', params: { action: 'events', since: '@since', until: '@until' },
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    }
  });
}]);
