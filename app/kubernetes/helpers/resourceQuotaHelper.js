import { KubernetesPortainerResourceQuotaPrefix } from 'Kubernetes/models/resource-quota/models';

class KubernetesResourceQuotaHelper {
  static generateResourceQuotaName(name) {
    return KubernetesPortainerResourceQuotaPrefix + name;
  }

  static formatBytes(bytes, decimals = 0, base10 = true) {
    const res = {
      size: 0,
      sizeUnit: 'B',
    };

    if (bytes === 0) {
      return res;
    }

    const k = base10 ? 1000 : 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return {
      size: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)),
      sizeUnit: sizes[i],
    };
  }
}

export default KubernetesResourceQuotaHelper;
