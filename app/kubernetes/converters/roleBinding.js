import _ from 'lodash-es';
import {
  KubernetesPortainerRoleBindingSuffix,
  KubernetesRoleBinding
} from 'Kubernetes/models/role-binding/models';
import { KubernetesPortainerServiceAccountUserSuffix,
  KubernetesPortainerServiceAccountTeamSuffix,
  KubernetesServiceAccount,
  KubernetesServiceAccountTypes
} from 'Kubernetes/models/service-account/models';
import {
  KubernetesRoleBindingCreatePayload,
  KubernetesRoleBindingGetPayload,
  KubernetesRoleBindingSubjectPayload,
  KubernetesRoleBindingUpdatePayload
} from 'Kubernetes/models/role-binding/payloads';
import KubernetesServiceAccountConverter from './serviceAccount';

class KubernetesRoleBindingConverter {
  /**
   * API RoleBinding to front RoleBinding
   */
  static subjectToServiceAccount(item) {
    const res = new KubernetesServiceAccount();
    let uid;
    if (_.startsWith(item.name, KubernetesPortainerServiceAccountUserSuffix)) {
      uid = KubernetesServiceAccountConverter.extractUidFromName(item.name, KubernetesPortainerServiceAccountUserSuffix);
      res.Type = KubernetesServiceAccountTypes.USER;
    } else if (_.startsWith(item.name, KubernetesPortainerServiceAccountTeamSuffix)) {
      uid = KubernetesServiceAccountConverter.extractUidFromName(item.name, KubernetesPortainerServiceAccountTeamSuffix);
      res.Type = KubernetesServiceAccountTypes.TEAM;
    } else {
      return;
    }
    res.UID = uid;
    return res;
  }
  static apiToRoleBinding(data) {
    const res = new KubernetesRoleBinding();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.AuthorizedUsersAndTeams = _.without(_.map(data.subjects, this.subjectToServiceAccount), undefined);
    return res;
  }

  /**
   * GET payload
   */
  static getPayload(namespace) {
    const res = new KubernetesRoleBindingGetPayload();
    res.id = _.startsWith(namespace, KubernetesPortainerRoleBindingSuffix) ? namespace : KubernetesPortainerRoleBindingSuffix + namespace;
    return res;
  }

  /**
   * CREATE payload
   */
  static createPayload(namespace) {
    const res = new KubernetesRoleBindingCreatePayload();
    res.metadata.name = KubernetesPortainerRoleBindingSuffix + namespace;
    res.metadata.namespace = namespace;
    return res;
  }

  /**
   * UPDATE payload
   */
  static updatePayload(roleBinding, newAccesses) {
    const res = new KubernetesRoleBindingUpdatePayload();
    res.metadata.uid = roleBinding.Id;
    res.metadata.name = roleBinding.Name;
    res.metadata.namespace = roleBinding.Namespace;
    res.subjects = _.map(newAccesses, (item) => {
      const res = new KubernetesRoleBindingSubjectPayload();
      res.name = item.Name;
      return res;
    });
    return res;
  }
}

export default KubernetesRoleBindingConverter;