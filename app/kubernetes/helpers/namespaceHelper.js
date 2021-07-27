import angular from 'angular';

class KubernetesNamespaceHelper {
  /* @ngInject */
  constructor(KUBERNETES_SYSTEM_NAMESPACES, KUBERNETES_DEFAULT_NAMESPACE) {
    this.KUBERNETES_SYSTEM_NAMESPACES = KUBERNETES_SYSTEM_NAMESPACES;
    this.KUBERNETES_DEFAULT_NAMESPACE = KUBERNETES_DEFAULT_NAMESPACE;
  }

  isSystemNamespace(namespace) {
    return namespace.IsSystem;
  }

  isDefaultNamespace(namespace) {
    return namespace === this.KUBERNETES_DEFAULT_NAMESPACE;
  }
}

export default KubernetesNamespaceHelper;
angular.module('portainer.app').service('KubernetesNamespaceHelper', KubernetesNamespaceHelper);
