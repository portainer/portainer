import { KubernetesSecretCreatePayload } from 'Kubernetes/models/secret/payloads';
import { KubernetesApplicationStackAnnotationKey } from 'Kubernetes/models/application/models';

class KubernetesSecretConverter {
  static createPayload(secret) {
    const res = new KubernetesSecretCreatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.metadata.annotations[KubernetesApplicationStackAnnotationKey] = secret.StackName;
    res.data = secret.Data;
    return res;
  }
}

export default KubernetesSecretConverter;