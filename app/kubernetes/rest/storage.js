angular.module('portainer.kubernetes')
  .factory('KubernetesStorage', ['$resource', 'API_ENDPOINT_ENDPOINTS',
    function KubernetesStorageFactory($resource, API_ENDPOINT_ENDPOINTS) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:id/kubernetes/apis/storage.k8s.io/v1/storageclasses', {}, {
          query: { method: 'GET', timeout: 15000, params: { id: '@id' }},
        });
    }]);
