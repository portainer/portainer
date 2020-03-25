import { rawResponse } from 'Kubernetes/rest/response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesDeployments', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesDeploymentsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function (namespace) {
      const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1'
        + (namespace ? '/namespaces/:namespace' : '') + '/deployments/:id/:action';
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          get: {
            method: 'GET',
            timeout: 15000,
            ignoreLoadingBar: true
          },
          getYaml: {
            method: 'GET',
            headers: {
              'Accept': 'application/yaml'
            },
            transformResponse: rawResponse,
            ignoreLoadingBar: true
          },
          create: { method: 'POST' },
          update: { method: 'PUT' },
          delete: { method: 'DELETE' }
        }
      );
    };
  }
]);
