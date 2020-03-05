import { KubernetesPortainerLimitRangePrefix } from 'Kubernetes/models/limit-range/models';

class KubernetesLimitRangeHelper {
  static generateLimitRangeName(name) {
    return KubernetesPortainerLimitRangePrefix + name;
  }
}

export default KubernetesLimitRangeHelper;