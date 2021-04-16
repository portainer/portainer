import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * Payload for CREATE
 */
const _KubernetesConfigMapCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  data: {},
  binaryData: {},
});
export class KubernetesConfigMapCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfigMapCreatePayload)));
  }
}

/**
 * Payload for UPDATE
 */
const _KubernetesConfigMapUpdatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  data: {},
  binaryData: {},
});
export class KubernetesConfigMapUpdatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfigMapUpdatePayload)));
  }
}
