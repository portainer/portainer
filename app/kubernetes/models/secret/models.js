/**
 * KubernetesApplicationSecret Model
 */
const _KubernetesApplicationSecret = Object.freeze({
  Id: 0,
  Name: '',
  Namespace: '',
  Type: '',
  CreationDate: '',
  ConfigurationOwner: '',
  Yaml: '',
  Data: [],
  Annotations: [],
});

export class KubernetesApplicationSecret {
  constructor() {
    Object.assign(this, _KubernetesApplicationSecret);
  }
}
