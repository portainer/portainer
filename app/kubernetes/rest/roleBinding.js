import { rawResponse } from './response/transform';

angular.module('portainer.kubernetes')
  .factory('KubernetesRoleBindings', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesRoleBindingsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return function (namespace) {
        const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/rbac.authorization.k8s.io/v1'
          + (namespace ? '/namespaces/:namespace' : '') + '/rolebindings/:id/:action';
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
            update: { method: 'PUT', params: { id: '@metadata.name' } },
            delete: { method: 'DELETE' }
          }
        );
      };
    }
  ]);