export const KubernetesPortainerConfigMapNamespace = 'ns-portainer';
export const KubernetesPortainerConfigMapConfigName = 'portainer-config';

/**
 * ConfigMap Model
 */
const _KubernetesConfigMap = Object.freeze({
  Id: 0,
  Name: '',
  Namespace: '',
  Data: {}
});

export class KubernetesConfigMap {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfigMap)));
  }
}