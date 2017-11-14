angular.module('portainer.rest')
.factory('OrcaEndpoint', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function OrcaEndpointFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/orca/endpoint/:providerid/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    discover: { method: 'GET', isArray: true, params: { providerid: '@providerid', action: 'discover' } },
    list: { method: 'GET', isArray: true, params: { providerid: '@providerid', action: 'list' } },
  });
}]);
