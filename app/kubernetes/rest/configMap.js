import { rawResponse } from 'Kubernetes/rest/response/transform';

angular.module('portainer.kubernetes').factory('KubernetesConfigMaps', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function KubernetesConfigMapsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function (namespace) {
      const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1' + (namespace ? '/namespaces/:namespace' : '') + '/configmaps/:id/:action';
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
          delete: { method: 'DELETE' },
        }
      );
    };
  },
]);
