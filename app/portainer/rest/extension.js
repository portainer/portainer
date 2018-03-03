angular.module('portainer.app')
.factory('Extensions', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function Extensions($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/extensions', {
    endpointId: EndpointProvider.endpointID
  },
  {
    register: { method: 'POST', params: { endpointId: '@endpointId' } }
  });
}]);
