import { KubernetesResourcePool } from 'Kubernetes/models/resource-pool/models';

class KubernetesResourcePoolConverter {
  static apiToResourcePool(namespace) {
    const res = new KubernetesResourcePool();
    res.Namespace = namespace;
    res.Yaml = namespace.Yaml;
    return res;
  }
}

export default KubernetesResourcePoolConverter;
