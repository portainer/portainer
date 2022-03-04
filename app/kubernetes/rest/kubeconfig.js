import angular from 'angular';

angular.module('portainer.kubernetes').factory('KubernetesConfig', KubernetesConfigFactory);

/* @ngInject */
function KubernetesConfigFactory($http, EndpointProvider, API_ENDPOINT_KUBERNETES) {
  return { get };

  async function get(environmentIDs) {
    return $http({
      method: 'GET',
      url: `${API_ENDPOINT_KUBERNETES}/config`,
      params: { ids: JSON.stringify(environmentIDs.map((x) => parseInt(x))) },
      responseType: 'blob',
      headers: {
        Accept: 'text/yaml',
      },
    });
  }
}
