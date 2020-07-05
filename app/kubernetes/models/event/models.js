/**
 * KubernetesEvent Model
 */
const _KubernetesEvent = Object.freeze({
  Id: '',
  Date: 0,
  Type: '',
  Message: '',
  Involved: {},
});

export class KubernetesEvent {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesEvent)));
  }
}
