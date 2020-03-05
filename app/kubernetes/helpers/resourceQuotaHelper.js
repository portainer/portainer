import { KubernetesPortainerResourceQuotaPrefix } from 'Kubernetes/models/resource-quota/models';

class KubernetesResourceQuotaHelper {
  static generateResourceQuotaName(name) {
    return KubernetesPortainerResourceQuotaPrefix + name;
  }
}

export default KubernetesResourceQuotaHelper;