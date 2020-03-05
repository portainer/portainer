import { KubernetesNamespace } from 'Kubernetes/models/namespace/models';
import { KubernetesNamespaceCreatePayload } from 'Kubernetes/models/namespace/payloads';

class KubernetesNamespaceConverter {
  static apiToNamespace(data, yaml) {
    const res = new KubernetesNamespace();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.CreatedAt = data.metadata.creationTimestamp;
    res.Status = data.status.phase;
    res.Yaml = yaml ? yaml.data : '';
    return res;
  }

  static createPayload(name) {
    const res = new KubernetesNamespaceCreatePayload();
    res.metadata.name = name;
    return res;
  }
}

export default KubernetesNamespaceConverter;