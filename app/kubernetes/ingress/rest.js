import { rawResponse } from 'Kubernetes/rest/response/transform';

angular.module('portainer.kubernetes').factory('KubernetesIngresses', factory);

function factory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return function (namespace) {
    const url = `${API_ENDPOINT_ENDPOINTS}/:endpointId/kubernetes/apis/networking.k8s.io/v1${namespace ? '/namespaces/:namespace' : ''}/ingresses/:id/:action`;
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
            'Content-Type': 'application/json-patch+json',
          },
        },
        delete: { method: 'DELETE' },
      }
    );
  };
}
