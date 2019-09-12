import { rawResponse } from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesSecrets', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesSecretsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1';
      if (namespace) {
        url += '/namespaces/:namespace/secrets/:id/:action'
      } else {
        url += '/secrets/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 },
          secret: {
            method: 'GET'
          },
          yamlSecret: {
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
