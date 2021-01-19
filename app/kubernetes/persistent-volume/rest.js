angular.module('portainer.kubernetes').factory('KubernetesPersistentVolume', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function KubernetesPersistentVolume($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function (namespace) {
      const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1' + (namespace ? '/namespaces/:namespace' : '') + '/persistentvolumes/:id/:action';
      return $resource(
        url,
        {
          endpointId: EndpointProvider.endpointID,
          namespace: namespace,
        },
        {
          get: { method: 'GET' },
          create: { method: 'POST' },
          delete: { method: 'DELETE' },
        }
      );
    };
  },
]);
