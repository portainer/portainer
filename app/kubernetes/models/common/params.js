/**
 * Generic params
 */
const _KubernetesCommonParams = Object.freeze({
  id: '',
});
export class KubernetesCommonParams {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesCommonParams)));
  }
}
