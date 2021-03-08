/**
 * KubernetesApplicationSecret Model
 */
const _KubernetesApplicationSecret = Object.freeze({
  Id: 0,
  Name: '',
  Namespace: '',
  CreationDate: '',
  ConfigurationOwner: '',
  Yaml: '',
  Data: [],
});

export class KubernetesApplicationSecret {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationSecret)));
  }
}
