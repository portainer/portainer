import angular from 'angular';
import _ from 'lodash-es';

import { KUBERNETES_DEFAULT_NAMESPACE, KUBERNETES_DEFAULT_SYSTEM_NAMESPACES } from 'Kubernetes/models/namespace/models';

class KubernetesNamespaceHelper {
  /* @ngInject */
  constructor() {}

  isSystemNamespace(namespace) {
    return namespace.IsSystem;
  }

  isDefaultNamespace(namespace) {
    return namespace === KUBERNETES_DEFAULT_NAMESPACE;
  }

  isDefaultSystemNamespace(namespace) {
    return _.includes(KUBERNETES_DEFAULT_SYSTEM_NAMESPACES, namespace);
  }
}

export default KubernetesNamespaceHelper;
angular.module('portainer.app').service('KubernetesNamespaceHelper', KubernetesNamespaceHelper);
