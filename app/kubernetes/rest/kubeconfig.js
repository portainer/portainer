angular.module('portainer.kubernetes').factory('KubernetesConfig', [
  '$http',
  'EndpointProvider',
  function KubernetesConfigFactory($http, EndpointProvider) {
    'use strict';
    const BASE_URL = '/api/kubernetes';

    return { get };

    async function get() {
      const endpointID = EndpointProvider.endpointID();
      return $http({
        method: 'GET',
        url: `${BASE_URL}/${endpointID}/config`,
        responseType: 'blob',
        headers: {
          Accept: 'text/yaml',
        },
      });
    }
  },
]);
