// TODO: legacy extension management
angular.module('portainer.app')
.factory('LegacyExtensions', ['$resource', 'EndpointProvider', 'API_ENDPOINT_ENDPOINTS', function LegacyExtensions($resource, EndpointProvider, API_ENDPOINT_ENDPOINTS) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/extensions/:type', {
    endpointId: EndpointProvider.endpointID
  },
  {
    register: { method: 'POST' },
    deregister: { method: 'DELETE', params: { type: '@type' } }
  });
}]);
