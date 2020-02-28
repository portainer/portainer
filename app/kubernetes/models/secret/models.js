/**
 * KubernetesApplicationSecret Model
 */
const _KubernetesApplicationSecret = Object.freeze({
  Name: '',
  Namespace: '',
  StackName: '',
  Type: 'Opaque',
  Data: {}
});

export class KubernetesApplicationSecret {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationSecret)));
  }
}