angular.module('portainer.kubernetes')
.factory('KubernetesDaemonSets', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesDaemonSetsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1/namespaces/:namespace/daemonsets/:id/:action',
      {
        endpointId: EndpointProvider.endpointID
      },
      {
        query: {
          method: 'GET',
          url: API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1/daemonsets'
        },
        create: { method: 'POST', params: { namespace: '@metadata.namespace' } }
      });
  }]);