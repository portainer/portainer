import { rawResponse } from './response/transform'

angular.module('portainer.kubernetes')
.factory('KubernetesConfigs', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesConfigsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1';
      if (namespace) {
        url += '/namespaces/:namespace/configmaps/:id/:action'
      } else {
        url += '/configmaps/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 },
          config: {
            method: 'GET'
          },
          yamlConfig: {
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
