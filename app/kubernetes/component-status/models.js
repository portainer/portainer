/**
 * KubernetesComponentStatus Model
 */
const _KubernetesComponentStatus = Object.freeze({
  ComponentName: '',
  Healthy: false,
  ErrorMessage: '',
});

export class KubernetesComponentStatus {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesComponentStatus)));
  }
}
