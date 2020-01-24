import { KubernetesServiceAccount, KubernetesPortainerServiceAccountSuffix, KubernetesPortainerServiceAccountNamespace } from 'Kubernetes/models/service-account/models';
import { KubernetesServiceAccountGetPayload, KubernetesServiceAccountCreatePayload, KubernetesServiceAccountUpdatePayload } from 'Kubernetes/models/service-account/payloads';

class KubernetesServiceAccountConvertor {
  /**
   * API ServiceAccount to front ServiceAccount
   */
  static apiToServiceAccount(data) {
    const res = new KubernetesServiceAccount();
    void data;
    return res;
  }

  /**
   * GET payload
   */
  static getPayload(name) {
    const res = new KubernetesServiceAccountGetPayload();
    res.id = name;
    return res;
  }
  static getPayloadFromUser(user) {
    const res = new KubernetesServiceAccountGetPayload();
    res.id = KubernetesPortainerServiceAccountSuffix + user.Id + '-' + user.Name;
    return res;
  }

  /**
   * CREATE payload
   */
  static createPayload(user) {
    const res = new KubernetesServiceAccountCreatePayload();
    res.metadata.name = KubernetesPortainerServiceAccountSuffix + user.Id + '-' + user.Name;
    res.metadata.namespace = KubernetesPortainerServiceAccountNamespace;
    return res;
  }

  /**
   * UPDATE payload
   */
  static updatePayload(serviceAccount) {
    const res = new KubernetesServiceAccountUpdatePayload();
    void serviceAccount;
    return res;
  }
}

export default KubernetesServiceAccountConvertor;