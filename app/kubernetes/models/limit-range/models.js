import KubernetesLimitRangeHelper from "Kubernetes/helpers/limitRangeHelper";

export const KubernetesLimitRangeDefaults = {
  CpuLimit: 0.10,
  MemoryLimit: 64 // MB
};

export const KubernetesPortainerLimitRangePrefix = 'portainer-lr-';

/**
 * KubernetesLimitRange Model
 */
const _KubernetesLimitRange = Object.freeze({
  Id: '',
  Namespace: '',
  Name: '',
  Yaml: '',
  CPU: KubernetesLimitRangeDefaults.CpuLimit,
  Memory: KubernetesLimitRangeDefaults.MemoryLimit
});

export class KubernetesLimitRange {
  constructor(namespace) {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesLimitRange)));
    if (namespace) {
      this.Name = KubernetesLimitRangeHelper.generateLimitRangeName(namespace);
      this.Namespace = namespace;
    }
  }
}
