angular.module('portainer.kubernetes')
.factory('KubernetesNamespaceService', ['$async', 'KubernetesNamespaces', function KubernetesNamespaceServiceFactory($async, KubernetesNamespaces) {
  'use strict';
  const service = {};

  service.namespaces = namespaces;

  async function namespacesAsync() {
    try {
      const namespaces = await KubernetesNamespaces.query().$promise;
      return namespaces.items;
    } catch (err) {
      throw { msg: 'Unable to retrieve namespaces', err: err };
    }
  }

  function namespaces() {
    return $async(namespacesAsync);
  }

  return service;
}]);
