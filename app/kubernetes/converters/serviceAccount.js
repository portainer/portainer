import _ from 'lodash-es';

import { KubernetesServiceAccount, KubernetesPortainerServiceAccountSuffix, KubernetesPortainerServiceAccountNamespace } from 'Kubernetes/models/service-account/models';
import { KubernetesServiceAccountGetPayload, KubernetesServiceAccountCreatePayload } from 'Kubernetes/models/service-account/payloads';

class KubernetesServiceAccountConverter {
  /**
   * API ServiceAccount to front ServiceAccount
   */
  static apiToServiceAccount(data) {
    const res = new KubernetesServiceAccount();
    res.Id = data.metadata.uid;
    const name = data.metadata.name;
    res.Name = name;
    if (_.startsWith(name, KubernetesPortainerServiceAccountSuffix)) {
      const infos = _.split(_.trimStart(name, KubernetesPortainerServiceAccountSuffix), '-');
      res.UserId = parseInt(infos[0]);
      res.UserName = infos[1];
    }
    res.Secrets = data.secrets;
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
  static getForUserPayload(user) {
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
  // static updatePayload(serviceAccount) {
  //   const res = new KubernetesServiceAccountUpdatePayload();
  //   res.metadata.name = serviceAccount.Name;
  //   res.metadata.namespace = KubernetesPortainerServiceAccountNamespace;
  //   res.secrets = serviceAccount.Secrets;
  //   return res;
  // }
}

export default KubernetesServiceAccountConverter;