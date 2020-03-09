import KubernetesResourceQuotaHelper from "Kubernetes/helpers/resourceQuotaHelper";

export const KubernetesPortainerResourceQuotaPrefix = 'portainer-rq-';

export const KubernetesResourceQuotaDefaults = {
  CpuLimit: 0,
  MemoryLimit: 0
};

/**
 * KubernetesResourceQuota Model
 */
const _KubernetesResourceQuota = Object.freeze({
  Id: '',
  Namespace: '',
  Name: '',
  CpuLimit: KubernetesResourceQuotaDefaults.CpuLimit,
  MemoryLimit: KubernetesResourceQuotaDefaults.MemoryLimit,
  CpuLimitUsed: KubernetesResourceQuotaDefaults.CpuLimit,
  MemoryLimitUsed: KubernetesResourceQuotaDefaults.MemoryLimit,
  Yaml: '',
  ResourcePoolName: '',
  ResourcePoolOwner: '',
});

export class KubernetesResourceQuota {
  constructor(namespace) {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesResourceQuota)));
    if (namespace) {
      this.Name = KubernetesResourceQuotaHelper.generateResourceQuotaName(namespace);
      this.Namespace = namespace;
    }
  }
}
