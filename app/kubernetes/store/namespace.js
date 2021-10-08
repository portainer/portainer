// singleton pattern as:
// * we don't want to use AngularJS DI to fetch the single instance
// * we need to use the Store in static functions / non-instanciated classes
const storeNamespaces = {};

/**
 * Check if a namespace of the store is system or not
 * @param {String} name Namespace name
 * @returns Boolean
 */
export function isSystem(name) {
  return storeNamespaces[name] && storeNamespaces[name].IsSystem;
}

/**
 * Called from KubernetesNamespaceService.get()
 * @param {KubernetesNamespace[]} namespaces list of namespaces to update in Store
 */
export function updateNamespaces(namespaces) {
  namespaces.forEach((ns) => (storeNamespaces[ns.Name] = ns));
}
