import angular from 'angular';

angular.module('portainer.kubernetes').factory('KubernetesNodesLimits', KubernetesNodesLimitsFactory);

/* @ngInject */
function KubernetesNodesLimitsFactory($resource, API_ENDPOINT_KUBERNETES, EndpointProvider) {
  const url = API_ENDPOINT_KUBERNETES + '/:endpointId/nodes_limits';
  return $resource(
    url,
    {
      endpointId: EndpointProvider.endpointID,
    },
    {
      get: {
        method: 'GET',
        ignoreLoadingBar: true,
        transformResponse: (data) => ({ data: JSON.parse(data) }),
      },
    }
  );
}
