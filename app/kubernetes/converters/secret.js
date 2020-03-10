import { KubernetesSecretCreatePayload } from 'Kubernetes/models/secret/payloads';

class KubernetesSecretConverter {
  static createPayload(secret) {
    const res = new KubernetesSecretCreatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.data = secret.Data;
    return res;
  }
}

export default KubernetesSecretConverter;