import { KubernetesSecretCreatePayload, KubernetesSecretUpdatePayload } from 'Kubernetes/models/secret/payloads';
import { KubernetesApplicationSecret } from 'Kubernetes/models/secret/models';

class KubernetesSecretConverter {
  static createPayload(secret) {
    const res = new KubernetesSecretCreatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.data = secret.Data;
    return res;
  }

  static updatePayload(secret) {
    const res = new KubernetesSecretUpdatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.data = secret.Data;
    return res;
  }

  static apiToSecret(payload) {
    const res = new KubernetesApplicationSecret();
    res.Name = payload.metadata.name;
    res.Namespace = payload.metadata.namespace;
    res.CreationDate = payload.metadata.creationTimestamp;
    res.Data = payload.data;
    return res;
  }

  static configurationToSecret(configuration) {
    const res = KubernetesApplicationSecret();
    res.Name = configuration.Name;
    res.Namespace = configuration.Namespace;
    res.CreationDate = configuration.CreationDate;
    res.Data = configuration.Data;
    return res;
  }
}

export default KubernetesSecretConverter;
