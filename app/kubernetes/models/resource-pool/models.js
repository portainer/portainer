export const KubernetesPortainerResourcePoolNameLabel = 'io.portainer.kubernetes.resourcepool.name';

export const KubernetesPortainerResourcePoolOwnerLabel = 'io.portainer.kubernetes.resourcepool.owner';

export const KubernetesPortainerNamespaceSystemLabel = 'io.portainer.kubernetes.namespace.system';

/**
 * KubernetesResourcePool Model
 */
export function KubernetesResourcePool() {
  return {
    Namespace: {}, // KubernetesNamespace
    Quota: undefined, // KubernetesResourceQuota,
    Ingresses: [], // KubernetesIngress[]
    Yaml: '',
  };
}
