export const KubernetesPortainerConfigurationOwnerLabel = 'io.portainer.kubernetes.configuration.owner';
export const KubernetesPortainerConfigurationDataAnnotation = 'io.portainer.kubernetes.configuration.data';

/**
 * Configuration Model (Composite)
 */
const _KubernetesConfiguration = Object.freeze({
  Id: 0,
  Name: '',
  Type: '',
  Namespace: '',
  CreationDate: '',
  ConfigurationOwner: '',
  Used: false,
  Applications: [],
  Data: {},
});

export class KubernetesConfiguration {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfiguration)));
  }
}

export const KubernetesConfigurationTypes = Object.freeze({
  CONFIGMAP: 1,
  SECRET: 2,
});
