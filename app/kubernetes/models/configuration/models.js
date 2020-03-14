/**
 * Configuration Model
 */
const _KubernetesConfiguration = Object.freeze({
  Id: 0,
  Name: '',
  Type: '',
  Namespace: '',
  CreationDate: '',
  Used: false,
  Apps: [],
  Data: {}
});

export class KubernetesConfiguration {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfiguration)));
  }
}

export const KubernetesConfigurationTypes = Object.freeze({
  BASIC: 'Basic',
  SECRET: 'Secret'
});
