export const KubernetesPortainerServiceAccountSuffix = 'portainer-sa-';
export const KubernetesPortainerServiceAccountNamespace = 'portainer-ns'

/**
 * Role Binding Model
 */
const _KubernetesServiceAccount = Object.freeze({
});

export class KubernetesServiceAccount {
  constructor() {
    Object.assign(this, _KubernetesServiceAccount);
  }
}
