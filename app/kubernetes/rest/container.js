import { rawResponse } from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesContainers', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesContainersFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1';
      if (namespace) {
        url += '/namespaces/:namespace/pods/:id/:action'
      } else {
        url += '/pods/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 },
          container: {
            method: 'GET'
          },
          yamlContainer: {
            method: 'GET',
            headers: {
              'Accept': 'application/yaml'
            },
            transformResponse: rawResponse
          }
        }
      );
    };
  }
]);