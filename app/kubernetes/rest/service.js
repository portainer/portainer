angular.module('portainer.kubernetes')
.factory('KubernetesServices', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesServicesFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:namespace/services/:id/:action',
      {
        endpointId: EndpointProvider.endpointID
      },
      {
        create: { method: 'POST', params: { namespace: '@metadata.namespace' } }
      });
  }]);