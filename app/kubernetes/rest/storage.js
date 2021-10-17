import { rawResponse } from 'Kubernetes/rest/response/transform';

angular.module('portainer.kubernetes').factory('KubernetesStorage', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function KubernetesStorageFactory($resource, $browser, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function () {
      const url = `${$browser.baseHref()}${API_ENDPOINT_ENDPOINTS}/:endpointId/kubernetes/apis/storage.k8s.io/v1/storageclasses/:id/:action`;
      return $resource(
        url,
        {
          endpointId: EndpointProvider.endpointID,
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
          delete: { method: 'DELETE' },
        }
      );
    };
  },
]);
