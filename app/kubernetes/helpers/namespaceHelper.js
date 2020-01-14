import _ from 'lodash-es';
import angular from 'angular';

class KubernetesNamespaceHelper {
  constructor(KUBERNETES_SYSTEM_NAMESPACES) {
    this.KUBERNETES_SYSTEM_NAMESPACES = KUBERNETES_SYSTEM_NAMESPACES;
  }

  isSystemNamespace(item) {
    return _.includes(this.KUBERNETES_SYSTEM_NAMESPACES, item.Name);
  }
}

export default KubernetesNamespaceHelper;
angular.module('portainer.app').service('KubernetesNamespaceHelper', KubernetesNamespaceHelper);
