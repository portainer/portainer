import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';

export const KubernetesPortainerResourceQuotaPrefix = 'portainer-rq-';
export const KubernetesPortainerResourceQuotaCPULimit = 'limits.cpu';
export const KubernetesPortainerResourceQuotaMemoryLimit = 'limits.memory';
export const KubernetesPortainerResourceQuotaCPURequest = 'requests.cpu';
export const KubernetesPortainerResourceQuotaMemoryRequest = 'requests.memory';
export const KubernetesPortainerResourceQuotaLoadbalancers = 'services.loadbalancers';
export const KubernetesPortainerResourceQuotaStorageSuffix = '.storageclass.storage.k8s.io/requests.storage';

export const KubernetesResourceQuotaDefaults = {
  CpuLimit: 0,
  MemoryLimit: 0,
  LoadBalancers: 0,
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
    LoadBalancers: KubernetesResourceQuotaDefaults.LoadBalancers,
    Yaml: '',
    ResourcePoolName: '',
    ResourcePoolOwner: '',
    StorageRequests: [], // []KubernetesResourcePoolStorageClassFormValue
  };
}
