/**
 * Stack Model
 */
const _KubernetesStack = Object.freeze({
  Name: '',
  ResourcePool: '',
  Applications: [],
});

export class KubernetesStack {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStack)));
  }
}
