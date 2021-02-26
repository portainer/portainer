import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';

export const KubernetesPortainerResourceQuotaPrefix = 'portainer-rq-';
export const KubernetesPortainerResourceQuotaCPULimit = 'limits.cpu';
export const KubernetesPortainerResourceQuotaMemoryLimit = 'limits.memory';
export const KubernetesPortainerResourceQuotaCPURequest = 'requests.cpu';
export const KubernetesPortainerResourceQuotaMemoryRequest = 'requests.memory';

export const KubernetesResourceQuotaDefaults = {
  CpuLimit: 0,
  MemoryLimit: 0,
};

export function KubernetesResourceQuota(namespace) {
  return {
    Id: '',
    Namespace: namespace ? namespace : '',
    Name: namespace ? KubernetesResourceQuotaHelper.generateResourceQuotaName(namespace) : '',
    CpuLimit: KubernetesResourceQuotaDefaults.CpuLimit,
    MemoryLimit: KubernetesResourceQuotaDefaults.MemoryLimit,
    CpuLimitUsed: KubernetesResourceQuotaDefaults.CpuLimit,
    MemoryLimitUsed: KubernetesResourceQuotaDefaults.MemoryLimit,
    Yaml: '',
    ResourcePoolName: '',
    ResourcePoolOwner: '',
  };
}
