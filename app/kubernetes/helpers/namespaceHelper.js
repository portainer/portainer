import _ from 'lodash-es';
import angular from 'angular';

const KUBERNETES_SYSTEM_NAMESPACES = ['kube-system', 'kube-public', 'kube-node-lease', 'portainer'];
const KUBERNETES_DEFAULT_NAMESPACE = 'default';

class KubernetesNamespaceHelper {
  isSystemNamespace(namespace) {
    return _.includes(KUBERNETES_SYSTEM_NAMESPACES, namespace);
  }

  isDefaultNamespace(namespace) {
    return namespace === KUBERNETES_DEFAULT_NAMESPACE;
  }
}

export default KubernetesNamespaceHelper;
angular.module('portainer.app').service('KubernetesNamespaceHelper', KubernetesNamespaceHelper);
