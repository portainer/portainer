angular.module('portainer.kubernetes')
  .factory('KubernetesResourceQuotas', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesResourceQuotasFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/resourcequotas/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: { method: 'GET', timeout: 15000 },
          create: {
            method: 'POST',
            url: API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:namespace/resourcequotas',
            params: { namespace: '@metadata.name' }
          }
        });
    }]);
