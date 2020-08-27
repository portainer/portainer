export const KubernetesPortainerResourcePoolNameLabel = 'io.portainer.kubernetes.resourcepool.name';

export const KubernetesPortainerResourcePoolOwnerLabel = 'io.portainer.kubernetes.resourcepool.owner';

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
