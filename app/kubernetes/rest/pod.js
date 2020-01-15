import {rawResponse} from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesPods', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesPodsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:namespace/pods/:id/:action',
      {
        endpointId: EndpointProvider.endpointID
      },
      {
        query: { method: 'GET', timeout: 15000 },
        pod: {
          method: 'GET'
        },
        yamlPod: {
          method: 'GET',
          headers: {
            'Accept': 'application/yaml'
          },
          transformResponse: rawResponse
        }
      });
  }]);