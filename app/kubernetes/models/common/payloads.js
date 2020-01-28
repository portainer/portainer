/**
 * Generic metadata payload
 */
const _KubernetesCommonMetadataPayload = Object.freeze({
  uid: '',
  name: '',
  namespace: ''
})
export class KubernetesCommonMetadataPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesCommonMetadataPayload)));
  }
}