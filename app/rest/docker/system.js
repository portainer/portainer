angular.module('portainer.rest')
.factory('System', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function SystemFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';
  return $resource(DOCKER_ENDPOINT + '/:endpointId/:action/:subAction', {
    name: '@name',
    endpointId: EndpointProvider.endpointID
  },
  {
    info: { method: 'GET', params: { action: 'info' } },
    version: { method: 'GET', params: { action: 'version' } },
    events: {
      method: 'GET', params: { action: 'events', since: '@since', until: '@until' },
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    },
    auth: { method: 'POST', params: { action: 'auth' } },
    dataUsage: { method: 'GET', params: { action: 'system', subAction: 'df' } }
  });
}]);
