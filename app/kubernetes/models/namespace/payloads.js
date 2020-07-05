import { KubernetesCommonMetadataPayload } from '../common/payloads';

/**
 * KubernetesNamespaceCreatePayload Model
 */
const _KubernetesNamespaceCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
});

export class KubernetesNamespaceCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNamespaceCreatePayload)));
  }
}
