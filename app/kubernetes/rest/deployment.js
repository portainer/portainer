angular.module('portainer.kubernetes')
.factory('KubernetesDeployments', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesDeploymentsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1/namespaces/:namespace/deployments/:id/:action',
      {
        endpointId: EndpointProvider.endpointID
      },
      {
        create: { method: 'POST', params: { namespace: '@metadata.namespace' } }
      });
  }]);