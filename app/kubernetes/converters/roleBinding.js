import _ from 'lodash-es';
import { KubernetesRoleBinding, KubernetesRoleBindingUserOrTeam, KubernetesPortainerRoleBindingSuffix } from 'Kubernetes/models/role-binding/models';
import { KubernetesPortainerServiceAccountSuffix } from 'Kubernetes/models/service-account/models';
import { KubernetesRoleBindingGetPayload, KubernetesRoleBindingCreatePayload, KubernetesRoleBindingUpdatePayload, KubernetesRoleBindingSubjectPayload } from 'Kubernetes/models/role-binding/payloads';

class KubernetesRoleBindingConverter {
  /**
   * API RoleBinding to front RoleBinding
   */
  static subjectToUserOrTeam(item) {
    const res = new KubernetesRoleBindingUserOrTeam();
    const trimmed = _.trimStart(item.name, KubernetesPortainerServiceAccountSuffix);
    const infos = _.split(trimmed, '-');
    res.Id = parseInt(infos[0]);
    res.Name = infos[1];
    return res;
  }
  static apiToRoleBinding(data) {
    const res = new KubernetesRoleBinding();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.AuthorizedUsersAndTeams = _.map(data.subjects, this.subjectToUserOrTeam);
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
  static userOrTeamToApiSubject(item) {
    const res = new KubernetesRoleBindingSubjectPayload();
    res.name = KubernetesPortainerServiceAccountSuffix + item.Id + '-' + item.Name;
    return res;
  }
  static updatePayload(roleBinding, newAccesses) {
    const res = new KubernetesRoleBindingUpdatePayload();
    res.metadata.uid = roleBinding.Id;
    res.metadata.name = roleBinding.Name;
    res.metadata.namespace = roleBinding.Namespace;
    res.subjects = _.map(newAccesses, this.userOrTeamToApiSubject);
    return res;
  }
}

export default KubernetesRoleBindingConverter;