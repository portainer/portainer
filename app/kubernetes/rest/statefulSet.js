import { rawResponse } from 'Kubernetes/rest/response/transform';

angular.module('portainer.kubernetes').factory('KubernetesStatefulSets', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function KubernetesStatefulSetsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function (namespace) {
      const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1' + (namespace ? '/namespaces/:namespace' : '') + '/statefulsets/:id/:action';
      return $resource(
        url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace,
        },
        {
          get: {
            method: 'GET',
            ignoreLoadingBar: true,
          },
          getYaml: {
            method: 'GET',
            headers: {
              Accept: 'application/yaml',
            },
            transformResponse: rawResponse,
            ignoreLoadingBar: true,
          },
          create: { method: 'POST' },
          update: { method: 'PUT' },
          patch: {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json-patch+json',
            },
          },
          rollback: {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/strategic-merge-patch+json',
            },
          },
          delete: { method: 'DELETE' },
        }
      );
    };
  },
]);
