angular.module('portainer.app')
.factory('EndpointGroups', ['$resource', 'API_ENDPOINT_ENDPOINT_GROUPS', function EndpointGroupsFactory($resource, API_ENDPOINT_ENDPOINT_GROUPS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINT_GROUPS + '/:id/:action', {}, {
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id' } },
    update: { method: 'PUT', params: { id: '@id' } },
    updateAccess: { method: 'PUT', params: { id: '@id', action: 'access' } },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
