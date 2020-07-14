/**
 * KubernetesIngressRule Model
 */
const _KubernetesIngressRule = Object.freeze({
  ServiceName: '',
  Host: '',
  IP: '',
  Port: '',
  Path: '',
});

export class KubernetesIngressRule {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesIngressRule)));
  }
}
