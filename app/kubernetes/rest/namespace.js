angular.module('portainer.kubernetes')
  .factory('KubernetesNamespaces', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function VolumeFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: { method: 'GET', isArray: true, timeout: 15000},
        });
    }]);
