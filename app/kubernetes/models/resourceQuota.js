import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

export default function KubernetesResourceQuotaViewModel(data) {
  this.Namespace = data.metadata.namespace;
  this.Name = data.metadata.name;
  this.CpuLimit = 0;
  this.MemoryLimit = 0;
  if (data.spec.hard && data.spec.hard['limits.cpu']) {
    this.CpuLimit = parseInt(data.spec.hard['limits.cpu']);
    if (_.endsWith(data.spec.hard['limits.cpu'], 'm')) {
      this.CpuLimit /= 1000;
    }
  }
  if (data.spec.hard && data.spec.hard['limits.memory']) {
    this.MemoryLimit = filesizeParser(data.spec.hard['limits.memory'], {base: 10});
  }
  this.Raw = data;
}

export const KubernetesResourceQuotaDefaults = {
  CpuLimit: 0,
  MemoryLimit: 0
};

export const KubernetesPortainerQuotaSuffix = 'portainer-rq-';