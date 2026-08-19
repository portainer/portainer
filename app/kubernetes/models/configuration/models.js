export const KubernetesPortainerConfigurationOwnerLabel = 'io.portainer.kubernetes.configuration.owner';
export const KubernetesPortainerConfigurationDataAnnotation = 'io.portainer.kubernetes.configuration.data';

/**
 * Configuration Model (Composite)
 */
const _KubernetesConfiguration = Object.freeze({
  Id: 0,
  Name: '',
  Kind: '',
  Namespace: '',
  CreationDate: '',
  ConfigurationOwner: '',
  Used: false,
  Applications: [],
  Data: {},
  SecretType: '',
});

export class KubernetesConfiguration {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfiguration)));
  }
}

export const KubernetesConfigurationKinds = Object.freeze({
  CONFIGMAP: 1,
  SECRET: 2,
});

export const KubernetesSecretTypeOptions = Object.freeze({
  OPAQUE: { name: 'Opaque', value: 'Opaque' },
  SERVICEACCOUNTTOKEN: { name: 'Service account token', value: 'kubernetes.io/service-account-token' },
  DOCKERCFG: { name: 'Dockercfg', value: 'kubernetes.io/dockercfg' },
  DOCKERCONFIGJSON: { name: 'Dockerconfigjson', value: 'kubernetes.io/dockerconfigjson' },
  BASICAUTH: { name: 'Basic auth', value: 'kubernetes.io/basic-auth' },
  SSHAUTH: { name: 'SSH auth', value: 'kubernetes.io/ssh-auth' },
  TLS: { name: 'TLS', value: 'kubernetes.io/tls' },
  BOOTSTRAPTOKEN: { name: 'Bootstrap token', value: 'bootstrap.kubernetes.io/token' },
  CUSTOM: { name: 'Custom', value: 'Custom' },
});
