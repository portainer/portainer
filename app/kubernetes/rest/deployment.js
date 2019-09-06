angular.module('portainer.kubernetes')
  .factory('KubernetesDeployments', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesDeploymentsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1/deployments/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: { method: 'GET', timeout: 15000},
        });
    }]);
