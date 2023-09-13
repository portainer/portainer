export const systemNamespaces = [
  'kube-system',
  'kube-public',
  'kube-node-lease',
  'portainer',
];

export function isSystemNamespace(namespace: string) {
  return systemNamespaces.includes(namespace || '');
}
