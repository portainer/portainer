export const KubernetesPortainerServiceAccountUserSuffix = 'portainer-sa-user-';
export const KubernetesPortainerServiceAccountTeamSuffix = 'portainer-sa-team-';
export const KubernetesPortainerServiceAccountNamespace = 'ns-portainer'

/**
 * ServiceAccount types
 */
export const KubernetesServiceAccountTypes = Object.freeze({
  USER: 'user',
  TEAM: 'team'
});

/**
 * ServiceAccount Model
 */
const _KubernetesServiceAccount = Object.freeze({
  Id: 0,
  Name: '',
  UID: '',
  Type: '',
  Secrets: []
});
export class KubernetesServiceAccount {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServiceAccount)));
  }
}
