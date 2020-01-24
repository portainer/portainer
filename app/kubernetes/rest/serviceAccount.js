import { rawResponse } from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesServiceAccounts', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesServiceAccountsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function(namespace) {
      const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1'
        + (namespace ? '/namespaces/:namespace' : '') + '/serviceaccounts/:id/:action';
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          get: { method: 'GET', timeout: 15000 },
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