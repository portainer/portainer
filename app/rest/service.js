angular.module('portainer.rest')
.factory('Service', ['$resource', 'Settings', 'EndpointProvider', function ServiceFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/services/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} },
    create: { method: 'POST', params: {action: 'create'} },
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
