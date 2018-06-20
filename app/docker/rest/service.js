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
      headers: {
        'X-Registry-Auth': HttpRequestHelper.registryAuthenticationHeader,
        // TODO: This is a temporary work-around that allows us to leverage digest pinning on
        // the Docker daemon side. It has been moved client-side since Docker API version > 1.29.
        // We should introduce digest pinning in Portainer as well.
        'version': '1.29'
      },
      ignoreLoadingBar: true
    },
    update: {
      method: 'POST', params: { id: '@id', action: 'update', version: '@version' },
      headers: {
        // TODO: This is a temporary work-around that allows us to leverage digest pinning on
        // the Docker daemon side. It has been moved client-side since Docker API version > 1.29.
        // We should introduce digest pinning in Portainer as well.
        'version': '1.29'
      }
    },
    remove: { method: 'DELETE', params: {id: '@id'} },
    logs: {
      method: 'GET', params: { id: '@id', action: 'logs' },
      timeout: 4500, ignoreLoadingBar: true,
      transformResponse: logsHandler
    }
  });
}]);
