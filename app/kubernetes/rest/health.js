angular.module('portainer.kubernetes')
  .factory('KubernetesHealth', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesHealthFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/healthz',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          ping: { method: 'GET', timeout: 15000 },
        });
    }]);
