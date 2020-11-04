import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';
import filesizeParser from 'filesize-parser';

import {
  KubernetesResourceQuota,
  KubernetesPortainerResourceQuotaCPULimit,
  KubernetesPortainerResourceQuotaMemoryLimit,
  KubernetesPortainerResourceQuotaCPURequest,
  KubernetesPortainerResourceQuotaMemoryRequest,
  KubernetesPortainerResourceQuotaLoadbalancers,
  KubernetesPortainerResourceQuotaStorageSuffix,
  KubernetesResourceQuotaDefaults,
} from 'Kubernetes/models/resource-quota/models';
import { KubernetesResourceQuotaCreatePayload } from 'Kubernetes/models/resource-quota/payloads';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';
import { KubernetesPortainerResourcePoolNameLabel, KubernetesPortainerResourcePoolOwnerLabel } from 'Kubernetes/models/resource-pool/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import { KubernetesResourcePoolStorageClassFormValue, KubernetesResourcePoolFormValues } from 'Kubernetes/models/resource-pool/formValues';

class KubernetesResourceQuotaConverter {
  static apiToResourceQuota(data, yaml) {
    const res = new KubernetesResourceQuota();
    res.Id = data.metadata.uid;
    res.Namespace = data.metadata.namespace;
    res.Name = data.metadata.name;
    res.CpuLimit = 0;
    res.MemoryLimit = 0;
    if (data.spec.hard && data.spec.hard[KubernetesPortainerResourceQuotaCPULimit]) {
      res.CpuLimit = KubernetesResourceReservationHelper.parseCPU(data.spec.hard[KubernetesPortainerResourceQuotaCPULimit]);
    }
    if (data.spec.hard && data.spec.hard[KubernetesPortainerResourceQuotaMemoryLimit]) {
      res.MemoryLimit = filesizeParser(data.spec.hard[KubernetesPortainerResourceQuotaMemoryLimit], { base: 10 });
    }

    res.MemoryLimitUsed = 0;
    if (data.status.used && data.status.used[KubernetesPortainerResourceQuotaMemoryLimit]) {
      res.MemoryLimitUsed = filesizeParser(data.status.used[KubernetesPortainerResourceQuotaMemoryLimit], { base: 10 });
    }

    res.CpuLimitUsed = 0;
    if (data.status.used && data.status.used[KubernetesPortainerResourceQuotaCPULimit]) {
      res.CpuLimitUsed = KubernetesResourceReservationHelper.parseCPU(data.status.used[KubernetesPortainerResourceQuotaCPULimit]);
    }

    res.LoadBalancers = null;
    if (data.spec.hard && data.spec.hard[KubernetesPortainerResourceQuotaLoadbalancers]) {
      res.LoadBalancers = parseInt(data.spec.hard[KubernetesPortainerResourceQuotaLoadbalancers], 10);
    }

    res.Yaml = yaml ? yaml.data : '';
    res.ResourcePoolName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolNameLabel] : '';
    res.ResourcePoolOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] : '';
    if (data.spec.hard) {
      const keys = _.filter(_.keys(data.spec.hard), (k) => _.endsWith(k, KubernetesPortainerResourceQuotaStorageSuffix));
      res.StorageRequests = _.map(keys, (k) => {
        const spec = data.spec.hard[k];
        const sr = new KubernetesResourcePoolStorageClassFormValue();
        sr.Name = _.replace(k, KubernetesPortainerResourceQuotaStorageSuffix, '');
        sr.Size = parseInt(spec, 10);
        sr.SizeUnit = sr.Size === 0 ? 'GB' : `${spec.slice(-1)}B`;
        sr.Selected = true;
        return sr;
      });
    }
    return res;
  }

  static createPayload(quota) {
    const res = new KubernetesResourceQuotaCreatePayload();
    res.metadata.name = KubernetesResourceQuotaHelper.generateResourceQuotaName(quota.Namespace);
    res.metadata.namespace = quota.Namespace;
    KubernetesCommonHelper.assignOrDeleteIfEmptyOrZero(res, `spec.hard['${KubernetesPortainerResourceQuotaCPURequest}']`, quota.CpuLimit);
    KubernetesCommonHelper.assignOrDeleteIfEmptyOrZero(res, `spec.hard['${KubernetesPortainerResourceQuotaMemoryRequest}']`, quota.MemoryLimit);
    KubernetesCommonHelper.assignOrDeleteIfEmptyOrZero(res, `spec.hard['${KubernetesPortainerResourceQuotaCPULimit}']`, quota.CpuLimit);
    KubernetesCommonHelper.assignOrDeleteIfEmptyOrZero(res, `spec.hard['${KubernetesPortainerResourceQuotaMemoryLimit}']`, quota.MemoryLimit);
    KubernetesCommonHelper.assignOrDeleteIfEmptyOrZero(res, `spec.hard['${KubernetesPortainerResourceQuotaLoadbalancers}']`, quota.LoadBalancers);
    if (quota.StorageRequests) {
      _.forEach(quota.StorageRequests, (sr) => {
        const key = KubernetesResourceQuotaHelper.generateResourceQuotaStorageKey(sr.Name);
        const value = `${sr.Size}${sr.SizeUnit.charAt(0)}`;
        res.spec.hard[key] = value;
      });
    }
    res.metadata.labels[KubernetesPortainerResourcePoolNameLabel] = quota.ResourcePoolName;
    if (quota.ResourcePoolOwner) {
      res.metadata.labels[KubernetesPortainerResourcePoolOwnerLabel] = quota.ResourcePoolOwner;
    }
    return res;
  }

  static updatePayload(quota) {
    const res = KubernetesResourceQuotaConverter.createPayload(quota);
    res.metadata.uid = quota.Id;
    return res;
  }

  static patchPayload(oldQuota, newQuota) {
    const oldPayload = KubernetesResourceQuotaConverter.createPayload(oldQuota);
    const newPayload = KubernetesResourceQuotaConverter.createPayload(newQuota);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }

  static quotaToResourcePoolFormValues(quota) {
    const res = new KubernetesResourcePoolFormValues(KubernetesResourceQuotaDefaults);
    res.Name = quota.Namespace;
    res.CpuLimit = quota.CpuLimit;
    res.MemoryLimit = KubernetesResourceReservationHelper.megaBytesValue(quota.MemoryLimit);
    if (quota.LoadBalancers !== null) {
      res.LoadBalancers = quota.LoadBalancers;
      res.UseLoadBalancersQuota = true;
    }
    if (res.CpuLimit || res.MemoryLimit) {
      res.HasQuota = true;
    }
    res.StorageClasses = quota.StorageRequests;
    return res;
  }

  static resourcePoolFormValuesToResourceQuota(formValues) {
    const storages = _.filter(formValues.StorageClasses, { Selected: true });
    if (formValues.HasQuota || formValues.UseLoadBalancersQuota || storages.length) {
      const quota = new KubernetesResourceQuota(formValues.Name);
      if (formValues.HasQuota) {
        quota.CpuLimit = formValues.CpuLimit;
        quota.MemoryLimit = KubernetesResourceReservationHelper.bytesValue(formValues.MemoryLimit);
      }
      quota.LoadBalancers = null;
      if (formValues.UseLoadBalancersQuota) {
        quota.LoadBalancers = formValues.LoadBalancers;
      }
      if (storages.length) {
        quota.StorageRequests = storages;
      }
      quota.ResourcePoolName = formValues.Name;
      quota.ResourcePoolOwner = formValues.Owner;
      return quota;
    }
  }
}

export default KubernetesResourceQuotaConverter;
