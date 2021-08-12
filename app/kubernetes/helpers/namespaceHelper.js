import _ from 'lodash-es';

import { KubernetesNamespace, KUBERNETES_DEFAULT_NAMESPACE, KUBERNETES_DEFAULT_SYSTEM_NAMESPACES } from 'Kubernetes/models/namespace/models';
import KubernetesNamespaceStore from 'Kubernetes/store/namespace';

export default class KubernetesNamespaceHelper {
  static isSystemNamespace(namespace) {
    let ns = namespace;
    if (typeof ns !== 'string') {
      if (ns.Namespace) {
        ns = typeof ns.Namespace === 'string' ? ns.Namespace : ns.Namespace.Name;
      } else if (ns.ResourcePool) {
        ns = typeof ns.ResourcePool === 'string' ? ns.ResourcePool : ns.ResourcePool.Namespace.Name;
      } else if (namespace instanceof KubernetesNamespace) {
        ns = namespace.Name;
      }
    }

    const found = KubernetesNamespaceStore.namespaces[ns];
    return found && found.IsSystem;
  }

  static isDefaultNamespace(namespace) {
    return namespace === KUBERNETES_DEFAULT_NAMESPACE;
  }

  static isDefaultSystemNamespace(namespace) {
    return _.includes(KUBERNETES_DEFAULT_SYSTEM_NAMESPACES, namespace);
  }
}
