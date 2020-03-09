export const KubernetesPortainerResourcePoolNameLabel = "io.portainer.kubernetes.resourcepool.name";

export const KubernetesPortainerResourcePoolOwnerLabel = "io.portainer.kubernetes.resourcepool.owner";

/**
 * KubernetesResourcePool Model
 * ResourcePool is a composite model that includes
 * A Namespace, a Quota and a LimitRange if it contains a resource quota
 */
const _KubernetesResourcePool = Object.freeze({
  Namespace: {}, // KubernetesNamespace
  Quota: undefined, // KubernetesResourceQuota
  LimitRange: undefined, // KubernetesLimitRange
  Yaml: ''
});

export class KubernetesResourcePool {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesResourcePool)));
  }
}