import _ from 'lodash-es';

import { KUBERNETES_DEFAULT_NAMESPACE, KUBERNETES_DEFAULT_SYSTEM_NAMESPACES } from 'Kubernetes/models/namespace/models';
import { isSystem } from 'Kubernetes/store/namespace';

export default class KubernetesNamespaceHelper {
  /**
   * Check if namespace is system or not
   * @param {String} namespace Namespace (string name) to evaluate
   * @returns Boolean
   */
  static isSystemNamespace(namespace) {
    return isSystem(namespace);
  }

  /**
   * Check if namespace is default or not
   * @param {String} namespace Namespace (string name) to evaluate
   * @returns Boolean
   */
  static isDefaultNamespace(namespace) {
    return namespace === KUBERNETES_DEFAULT_NAMESPACE;
  }

  /**
   * Check if namespace is one of the default system namespaces
   * @param {String} namespace Namespace (string name) to evaluate
   * @returns Boolean
   */
  static isDefaultSystemNamespace(namespace) {
    return _.includes(KUBERNETES_DEFAULT_SYSTEM_NAMESPACES, namespace);
  }
}
