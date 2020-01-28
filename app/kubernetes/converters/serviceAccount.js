import _ from 'lodash-es';

import {
  KubernetesPortainerServiceAccountNamespace,
  KubernetesPortainerServiceAccountUserSuffix,
  KubernetesPortainerServiceAccountTeamSuffix,
  KubernetesServiceAccount,
  KubernetesServiceAccountTypes
} from 'Kubernetes/models/service-account/models';
import {
  KubernetesServiceAccountCreatePayload,
  KubernetesServiceAccountGetPayload
} from 'Kubernetes/models/service-account/payloads';

import { TeamAccessViewModel } from 'Portainer/models/access';

class KubernetesServiceAccountConverter {
  /**
   * Utility function to extract ServiceAccount UID from name
   * pattern portianer-sa-<user|team>-<UID>
   */
  static extractUidFromName(name, suffix) {
    const infos = _.split(_.trimStart(name, suffix), '-');
    return parseInt(infos[0]);
  }

  /**
   * API ServiceAccount to front ServiceAccount
   */
  static apiToServiceAccount(data) {
    const res = new KubernetesServiceAccount();
    res.Id = data.metadata.uid;
    const name = data.metadata.name;
    res.Name = name;
    if (_.startsWith(name, KubernetesPortainerServiceAccountUserSuffix)) {
      const uid = this.extractUidFromName(name, KubernetesPortainerServiceAccountUserSuffix);
      res.Type = KubernetesServiceAccountTypes.USER;
      res.UID = uid
    } else if (_.startsWith(name, KubernetesPortainerServiceAccountTeamSuffix)) {
      const uid = this.extractUidFromName(name, KubernetesPortainerServiceAccountTeamSuffix);
      res.Type = KubernetesServiceAccountTypes.TEAM;
      res.UID = uid;
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
  static getForUserOrTeamPayload(userOrTeam) {
    const res = new KubernetesServiceAccountGetPayload();
    let suffix = KubernetesPortainerServiceAccountUserSuffix;
    if (userOrTeam instanceof TeamAccessViewModel) {
      suffix = KubernetesPortainerServiceAccountTeamSuffix;
    }
    res.id = suffix + userOrTeam.Id;
    return res;
  }

  /**
   * CREATE payload
   */
  static createPayload(userOrTeam) {
    const res = new KubernetesServiceAccountCreatePayload();
    let suffix = KubernetesPortainerServiceAccountUserSuffix;
    if (userOrTeam.Type === KubernetesServiceAccountTypes.TEAM) {
      suffix = KubernetesPortainerServiceAccountTeamSuffix;
    }
    res.metadata.name = suffix + userOrTeam.Id;
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