angular.module('portainer.rest')
.factory('Secret', ['$resource', 'Settings', 'EndpointProvider', function SecretFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/secrets/:id/:action', {
    endpointId: EndpointProvider.endpointID
  }, {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true },
    create: { method: 'POST', params: {action: 'create'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
