import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesSecretCreatePayload Model
 */
const _KubernetesSecretCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  type: 'Opaque',
  data: {},
  stringData: {},
});

export class KubernetesSecretCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesSecretCreatePayload)));
  }
}

/**
 * KubernetesSecretUpdatePayload Model
 */
const _KubernetesSecretUpdatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  type: 'Opaque',
  data: {},
  stringData: {},
});

export class KubernetesSecretUpdatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesSecretUpdatePayload)));
  }
}
