angular.module('portainer.kubernetes').factory('KubernetesHealth', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  function KubernetesHealthFactory($resource, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:id/kubernetes/healthz',
      {},
      {
        ping: { method: 'GET', params: { id: 'id' } },
      }
    );
  },
]);
