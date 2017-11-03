angular.module('portainer.rest')
.factory('Operation', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function OperationFactory($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/orca/operation/:id', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: { id: '@id' } }
  });
}]);
