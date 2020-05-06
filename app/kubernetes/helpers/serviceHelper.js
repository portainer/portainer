import { KubernetesServiceHeadlessPrefix } from 'Kubernetes/models/service/models';

class KubernetesServiceHelper {
  static generateHeadlessServiceName(name) {
    return KubernetesServiceHeadlessPrefix + name;
  }

}
export default KubernetesServiceHelper;