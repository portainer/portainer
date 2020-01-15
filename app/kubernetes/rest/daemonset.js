import {rawResponse} from './response/transform';

angular.module('portainer.kubernetes')
.factory('KubernetesDaemonSets', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesDaemonSetsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    // TODO: review on architecture/refactor meeting
    // I'm not sure we need to keep that optional namespace support for most of our rest services
    // It is a legacy from early kubernetes support if i'm correct.
    // I do prefer a clean rest service such as rest/resourceQuota.js
    return function(namespace) {
      let url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/apis/apps/v1';
      if (namespace) {
        url += '/namespaces/:namespace/daemonsets/:id/:action'
      } else {
        url += '/daemonsets/:id/:action';
      }
      return $resource(url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace
        },
        {
          query: { method: 'GET', timeout: 15000 },
          get: { method: 'GET' },
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