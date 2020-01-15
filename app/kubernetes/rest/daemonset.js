import { rawResponse } from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesDaemonSets', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesDaemonSetsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1';
      if (namespace) {
        url += '/namespaces/:namespace/daemonsets/:id/:action'
      } else {
        url += '/daemonsets/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 },
          get: { method: 'GET' },
          getYaml: {
            method: 'GET',
            headers: {
              'Accept': 'application/yaml'
            },
            transformResponse: rawResponse
          },
          create: { method: 'POST' },
          delete: { method: 'DELETE' }
        }
      );
    };
  }
]);