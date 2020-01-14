angular.module('portainer.kubernetes')
  .factory('KubernetesNamespaces', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesNamespacesFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: { method: 'GET', timeout: 15000},
          status: { method: 'GET', params: {action: 'status'}},
          create: { method: 'POST'},
          delete: { method: 'DELETE'}
        });
    }]);
