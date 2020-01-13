angular.module('portainer.kubernetes')
  .factory('KubernetesResourceQuotas', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesResourceQuotasFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:namespace/resourcequotas/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: {
            method: 'GET',
            timeout: 15000,
            url: API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/resourcequotas',
          },
          create: { method: 'POST', params: { namespace: '@metadata.namespace' } },
          update: { method: 'PUT', params: { namespace: '@metadata.namespace', id: '@metadata.name' } },
          delete: { method: 'DELETE'},
        });
    }]);
