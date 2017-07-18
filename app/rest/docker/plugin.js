angular.module('portainer.rest')
.factory('Plugin', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function PluginFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/plugins/:id/:action', {
    endpointId: EndpointProvider.endpointID
  }, {
    query: { method: 'GET', isArray: true }
  });
}]);
