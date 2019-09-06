angular.module('portainer.kubernetes')
  .factory('KubernetesServices', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesServicesFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/services/:id/:action',
        {
          endpointId: EndpointProvider.endpointID
        },
        {
          query: { method: 'GET', timeout: 15000},
        });
    }]);
