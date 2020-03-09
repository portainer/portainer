/**
 * KubernetesNamespace Model
 */
const _KubernetesNamespace = Object.freeze({
  Id: '',
  Name: '',
  CreatedAt: '',
  Status: '',
  Yaml: '',
  ResourcePoolName: '',
  ResourcePoolOwner: '',
});

export class KubernetesNamespace {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNamespace)));
  }
}