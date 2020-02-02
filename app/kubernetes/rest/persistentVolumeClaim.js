angular.module('portainer.kubernetes')
.factory('KubernetesPersistentVolumeClaims', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
  function KubernetesPersistentVolumeClaimsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1/namespaces/:namespace/persistentvolumeclaims/:id/:action',
      {
        endpointId: EndpointProvider.endpointID
      },
      {
        create: { method: 'POST', params: { namespace: '@metadata.namespace' } },
      });
  }]);