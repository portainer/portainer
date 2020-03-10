/**
 * KubernetesApplicationSecret Model
 */
const _KubernetesApplicationSecret = Object.freeze({
  Name: '',
  Namespace: '',
  Data: {}
});

export class KubernetesApplicationSecret {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationSecret)));
  }
}