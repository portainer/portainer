import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

import { KubernetesResourceQuota } from 'Kubernetes/models/resource-quota/models';
import { KubernetesResourceQuotaCreatePayload, KubernetesResourceQuotaUpdatePayload } from 'Kubernetes/models/resource-quota/payloads';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';

class KubernetesResourceQuotaConverter {
  static apiToResourceQuota(data, yaml) {
    const res = new KubernetesResourceQuota();
    res.Id = data.metadata.uid;
    res.Namespace = data.metadata.namespace;
    res.Name = data.metadata.name;
    res.CpuLimit = 0;
    res.MemoryLimit = 0;
    if (data.spec.hard && data.spec.hard['limits.cpu']) {
      res.CpuLimit = parseInt(data.spec.hard['limits.cpu']);
      if (_.endsWith(data.spec.hard['limits.cpu'], 'm')) {
        res.CpuLimit /= 1000;
      }
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
      res.CpuLimitUsed = parseInt(data.status.used['limits.cpu']);
      if (_.endsWith(data.status.used['limits.cpu'], 'm')) {
        res.CpuLimitUsed /= 1000;
      }
    }
    res.Yaml = yaml ? yaml.data : '';
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
    if (!quota.CpuLimit || quota.CpuLimit === 0) {
      delete res.spec.hard['requests.cpu'];
      delete res.spec.hard['limits.cpu'];
    }
    if (!quota.MemoryLimit || quota.MemoryLimit === 0) {
      delete res.spec.hard['requests.memory'];
      delete res.spec.hard['limits.memory'];
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
    if (!quota.CpuLimit || quota.CpuLimit === 0) {
      delete res.spec.hard['requests.cpu'];
      delete res.spec.hard['limits.cpu'];
    }
    if (!quota.MemoryLimit || quota.MemoryLimit === 0) {
      delete res.spec.hard['requests.memory'];
      delete res.spec.hard['limits.memory'];
    }
    return res;
  }
}

export default KubernetesResourceQuotaConverter;