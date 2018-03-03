angular.module('portainer.docker')
.factory('System', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function SystemFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/:action/:subAction', {
    name: '@name',
    endpointId: EndpointProvider.endpointID
  },
  {
    info: { method: 'GET', params: { action: 'info' }, ignoreLoadingBar: true },
    version: { method: 'GET', params: { action: 'version' }, ignoreLoadingBar: true, timeout: 4500 },
    events: {
      method: 'GET', params: { action: 'events', since: '@since', until: '@until' },
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    },
    auth: { method: 'POST', params: { action: 'auth' } },
    dataUsage: { method: 'GET', params: { action: 'system', subAction: 'df' } }
  });
}]);
