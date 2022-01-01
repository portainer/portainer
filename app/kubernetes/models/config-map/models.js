export const KubernetesPortainerConfigMapNamespace = 'portainer';
export const KubernetesPortainerConfigMapConfigName = 'portainer-config';
export const KubernetesPortainerConfigMapAccessKey = 'NamespaceAccessPolicies';

export function KubernetesPortainerAccessConfigMap() {
  return {
    Id: 0,
    Name: KubernetesPortainerConfigMapConfigName,
    Namespace: KubernetesPortainerConfigMapNamespace,
    Data: {},
  };
}

/**
 * ConfigMap Model
 */
const _KubernetesConfigMap = Object.freeze({
  Id: 0,
  Name: '',
  Namespace: '',
  Yaml: '',
  ConfigurationOwner: '',
  Data: [],
});

export class KubernetesConfigMap {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfigMap)));
  }
}
