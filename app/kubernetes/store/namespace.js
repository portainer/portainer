import _ from 'lodash-es';

class KubernetesNamespaceStore {
  constructor() {
    this.namespaces = {};
  }

  /**
   * Called from KubernetesNamespaceService.get()
   * @param {KubernetesNamespace[]} namespaces list of namespaces to update in Store
   */
  updateNamespaces(namespaces) {
    _.forEach(namespaces, (ns) => (this.namespaces[ns.Name] = ns));
  }
}

// singleton pattern as:
// * we don't want to use AngularJS DI to fetch the single instance
// * we need to use the Store in static functions / non-instanciated classes
export default new KubernetesNamespaceStore();
