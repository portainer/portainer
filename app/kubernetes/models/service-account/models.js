export const KubernetesPortainerServiceAccountSuffix = 'portainer-sa-';
export const KubernetesPortainerServiceAccountNamespace = 'ns-portainer'

/**
 * ServiceAccount Model
 */
const _KubernetesServiceAccount = Object.freeze({
  Id: 0,
  Name: '',
  UserId: '',
  UserName: '',
  Secrets: []
});
export class KubernetesServiceAccount {
  constructor() {
    Object.assign(this, _KubernetesServiceAccount);
  }
}
