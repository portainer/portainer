export const KUBERNETES_DEFAULT_NAMESPACE = 'default';

export function isDefaultNamespace(namespace: string) {
  return namespace === KUBERNETES_DEFAULT_NAMESPACE;
}
