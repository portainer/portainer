angular.module('portainer.docker')
.factory('Service', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'HttpRequestHelper' ,function ServiceFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, HttpRequestHelper) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/services/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} },
    create: {
      method: 'POST', params: {action: 'create'},
      headers: { 'X-Registry-Auth': HttpRequestHelper.registryAuthenticationHeader },
      ignoreLoadingBar: true
    },
    update: { method: 'POST', params: {id: '@id', action: 'update', version: '@version'} },
    remove: { method: 'DELETE', params: {id: '@id'} }
  });
}]);
