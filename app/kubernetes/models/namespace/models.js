export function KubernetesNamespace() {
  return {
    Id: '',
    Name: '',
    CreationDate: '',
    Status: '',
    Yaml: '',
    ResourcePoolName: '',
    ResourcePoolOwner: '',
    IsSystem: false,
    NamespaceSystemLabel: '',
  };
}

export const KUBERNETES_SYSTEM_NAMESPACES = ['kube-system', 'kube-public', 'kube-node-lease', 'portainer'];
