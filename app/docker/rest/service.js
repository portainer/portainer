angular.module('portainer.docker')
.factory('Service', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'HttpRequestHelper',
function ServiceFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, HttpRequestHelper) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/services/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} },
    create: {
      method: 'POST', params: {action: 'create'},
      // TODO: This is a temporary work-around that allows us to leverage digest pinning on
      // the Docker daemon side. It has been moved client-side since Docker API version > 1.30.
      // We should do digest pinning in Portainer as well.
      headers: {
        'X-Registry-Auth': HttpRequestHelper.registryAuthenticationHeader,
        'version': '1.29'
      },
      ignoreLoadingBar: true
    },
    update: {
      method: 'POST', params: { id: '@id', action: 'update', version: '@version' },
      // TODO: This is a temporary work-around that allows us to leverage digest pinning on
      // the Docker daemon side. It has been moved client-side since Docker API version > 1.30.
      // We should do digest pinning in Portainer as well.
      headers: { 'version': '1.29' }
    },
    remove: { method: 'DELETE', params: {id: '@id'} },
    logs: {
      method: 'GET', params: { id: '@id', action: 'logs' },
      timeout: 4500, ignoreLoadingBar: true,
      transformResponse: logsHandler
    }
  });
}]);
