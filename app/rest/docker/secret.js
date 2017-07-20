angular.module('portainer.rest')
.factory('Secret', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', function SecretFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/secrets/:id/:action', {
    endpointId: EndpointProvider.endpointID
  }, {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST', params: {action: 'create'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
