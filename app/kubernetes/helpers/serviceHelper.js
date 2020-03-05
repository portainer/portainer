import { KubernetesServiceHeadlessSuffix } from 'Kubernetes/models/service/models';

class KubernetesServiceHelper {
  static generateHeadlessServiceName(name) {
    return name + KubernetesServiceHeadlessSuffix;
  }
}
export default KubernetesServiceHelper;