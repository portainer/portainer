angular.module('portainer.kubernetes')
.factory('KubernetesEvents', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesEventsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1';
      if (namespace) {
        url += '/namespaces/:namespace/events/:id/:action'
      } else {
        url += '/events/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 }
        }
      );
    };
  }
]);
