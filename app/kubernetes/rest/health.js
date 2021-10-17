angular.module('portainer.kubernetes').factory('KubernetesHealth', [
  '$resource',
  '$browser',
  'API_ENDPOINT_ENDPOINTS',
  function KubernetesHealthFactory($resource, $browser, API_ENDPOINT_ENDPOINTS) {
    'use strict';
    return $resource(
      $browser.baseHref() + API_ENDPOINT_ENDPOINTS + '/:id/kubernetes/healthz',
      {},
      {
        ping: { method: 'GET', params: { id: 'id' } },
      }
    );
  },
]);
