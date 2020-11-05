angular.module('portainer.kubernetes').factory('KubernetesComponentStatus', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function KubernetesComponentStatusFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return function () {
      const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1' + '/componentstatuses/:id';
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
        }
      );
    };
  },
]);
