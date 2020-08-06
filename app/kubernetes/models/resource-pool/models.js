export const KubernetesPortainerResourcePoolNameLabel = 'io.portainer.kubernetes.resourcepool.name';

export const KubernetesPortainerResourcePoolOwnerLabel = 'io.portainer.kubernetes.resourcepool.owner';

/**
 * KubernetesResourcePool Model (Composite)
 * ResourcePool is a composite model that includes
 * A Namespace and a Quota
 */
const _KubernetesResourcePool = Object.freeze({
  Namespace: {}, // KubernetesNamespace
  Quota: undefined, // KubernetesResourceQuota,
  Ingresses: [], // KubernetesIngress[]
  Yaml: '',
});

export class KubernetesResourcePool {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesResourcePool)));
  }
}
