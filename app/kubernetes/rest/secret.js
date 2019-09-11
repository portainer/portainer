angular.module('portainer.kubernetes')
  .factory('KubernetesSecrets', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesSecretsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/secrets/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: { method: 'GET', timeout: 15000},
        });
    }]);
