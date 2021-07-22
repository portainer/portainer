angular.module('portainer.kubernetes').factory('KubernetesPortainerNamespaces', KubernetesPortainerNamespacesFactory);

function KubernetesPortainerNamespacesFactory($resource) {
  const url = '/api/kubernetes/:endpointId/namespaces/:namespaceName/:action';
  return $resource(
    url,
    {},
    {
      toggleSystem: { method: 'PUT', params: { action: 'system' } },
    }
  );
}
