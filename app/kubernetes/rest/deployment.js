import { rawResponse } from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesDeployments', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesDeploymentsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1';
      if (namespace) {
        url += '/namespaces/:namespace/deployments/:id/:action'
      } else {
        url += '/deployments/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 },
          deployment: {
            method: 'GET'
          },
          yamlDeployment: {
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