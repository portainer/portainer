export const KubernetesPortainerRoleBindingSuffix = 'portainer-rb-';

/**
 * Role Binding Model
 */
const _KubernetesRoleBinding = Object.freeze({
  Id: 0,
  Name: '',
  Namespace: '',
  AuthorizedUsersAndTeams: [] // KubernetesServiceAccount list
});

export class KubernetesRoleBinding {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesRoleBinding)));
  }
}