angular.module('portainer.rest')
.factory('OrcaStatus', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function OrcaStatusFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/orca/status/:id', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', isArray: true, params: { id: '@id' } },
  });
}]);
