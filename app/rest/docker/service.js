angular.module('portainer.rest')
.factory('Service', ['$resource', 'ENDPOINTS_ENDPOINT', 'EndpointProvider', 'HttpRequestHelper' ,function ServiceFactory($resource, ENDPOINTS_ENDPOINT, EndpointProvider, HttpRequestHelper) {
  'use strict';
  return $resource(ENDPOINTS_ENDPOINT + '/:endpointId/docker/services/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true },
    create: {
      method: 'POST', params: {action: 'create'},
      headers: { 'X-Registry-Auth': HttpRequestHelper.registryAuthenticationHeader }
    },
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
