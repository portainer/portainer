import filesizeParser from 'filesize-parser';

import { KubernetesResourceQuota } from 'Kubernetes/models/resource-quota/models';
import { KubernetesResourceQuotaCreatePayload, KubernetesResourceQuotaUpdatePayload } from 'Kubernetes/models/resource-quota/payloads';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';
import { KubernetesPortainerResourcePoolNameLabel, KubernetesPortainerResourcePoolOwnerLabel } from 'Kubernetes/models/resource-pool/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';

class KubernetesResourceQuotaConverter {
  static apiToResourceQuota(data, yaml) {
    const res = new KubernetesResourceQuota();
    res.Id = data.metadata.uid;
    res.Namespace = data.metadata.namespace;
    res.Name = data.metadata.name;
    res.CpuLimit = 0;
    res.MemoryLimit = 0;
    if (data.spec.hard && data.spec.hard['limits.cpu']) {
      res.CpuLimit = KubernetesResourceReservationHelper.parseCPU(data.spec.hard['limits.cpu']);
    }
    if (data.spec.hard && data.spec.hard['limits.memory']) {
      res.MemoryLimit = filesizeParser(data.spec.hard['limits.memory'], { base: 10 });
    }

    res.MemoryLimitUsed = 0;
    if (data.status.used && data.status.used['limits.memory']) {
      res.MemoryLimitUsed = filesizeParser(data.status.used['limits.memory'], { base: 10 });
    }

    res.CpuLimitUsed = 0;
    if (data.status.used && data.status.used['limits.cpu']) {
      res.CpuLimitUsed = KubernetesResourceReservationHelper.parseCPU(data.status.used['limits.cpu']);
    }

    res.LoadBalancers = null;
    if (data.spec.hard && data.spec.hard['services.loadbalancers']) {
      res.LoadBalancers = parseInt(data.spec.hard['services.loadbalancers']);
    }

    res.Yaml = yaml ? yaml.data : '';
    res.ResourcePoolName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolNameLabel] : '';
    res.ResourcePoolOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] : '';
    return res;
  }

  static createPayload(quota) {
    const res = new KubernetesResourceQuotaCreatePayload();
    res.metadata.name = KubernetesResourceQuotaHelper.generateResourceQuotaName(quota.Namespace);
    res.metadata.namespace = quota.Namespace;
    res.spec.hard['requests.cpu'] = quota.CpuLimit;
    res.spec.hard['requests.memory'] = quota.MemoryLimit;
    res.spec.hard['limits.cpu'] = quota.CpuLimit;
    res.spec.hard['limits.memory'] = quota.MemoryLimit;
    res.spec.hard['services.loadbalancers'] = quota.LoadBalancers;
    res.metadata.labels[KubernetesPortainerResourcePoolNameLabel] = quota.ResourcePoolName;
    if (quota.ResourcePoolOwner) {
      res.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] = quota.ResourcePoolOwner;
    }
    if (!quota.CpuLimit || quota.CpuLimit === 0) {
      delete res.spec.hard['requests.cpu'];
      delete res.spec.hard['limits.cpu'];
    }
    if (!quota.MemoryLimit || quota.MemoryLimit === 0) {
      delete res.spec.hard['requests.memory'];
      delete res.spec.hard['limits.memory'];
    }
    if (quota.LoadBalancers === null) {
      delete res.spec.hard['services.loadbalancers'];
    }
    return res;
  }

  static updatePayload(quota) {
    const res = new KubernetesResourceQuotaUpdatePayload();
    res.metadata.name = quota.Name;
    res.metadata.namespace = quota.Namespace;
    res.metadata.uid = quota.Id;
    res.spec.hard['requests.cpu'] = quota.CpuLimit;
    res.spec.hard['requests.memory'] = quota.MemoryLimit;
    res.spec.hard['limits.cpu'] = quota.CpuLimit;
    res.spec.hard['limits.memory'] = quota.MemoryLimit;
    res.spec.hard['services.loadbalancers'] = quota.LoadBalancers;
    res.metadata.labels[KubernetesPortainerResourcePoolNameLabel] = quota.ResourcePoolName;
    if (quota.ResourcePoolOwner) {
      res.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] = quota.ResourcePoolOwner;
    }
    if (!quota.CpuLimit || quota.CpuLimit === 0) {
      delete res.spec.hard['requests.cpu'];
      delete res.spec.hard['limits.cpu'];
    }
    if (!quota.MemoryLimit || quota.MemoryLimit === 0) {
      delete res.spec.hard['requests.memory'];
      delete res.spec.hard['limits.memory'];
    }
    if (quota.LoadBalancers === null) {
      delete res.spec.hard['services.loadbalancers'];
    }
    return res;
  }
}

export default KubernetesResourceQuotaConverter;
