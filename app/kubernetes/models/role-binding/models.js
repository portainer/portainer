export const KubernetesPortainerRoleBindingSuffix = 'portainer-rb-';

/**
 * Role Binding Model
 */
const _KubernetesRoleBinding = Object.freeze({
  Id: 0,
  Name: '',
  Namespace: '',
  AuthorizedUsersAndTeams: []
});

export class KubernetesRoleBinding {
  constructor() {
    Object.assign(this, _KubernetesRoleBinding);
  }
}

/**
 * Role Binding authorized users and teams
 */
const _KubernetesRoleBindingUserOrTeam = Object.freeze({
  Id: 0,
  Name: ''
});
export class KubernetesRoleBindingUserOrTeam {
  constructor() {
    Object.assign(this, _KubernetesRoleBindingUserOrTeam);
  }
}