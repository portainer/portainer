import { KubernetesCommonMetadataPayload } from "Kubernetes/models/common/payloads";

/**
 * KubernetesResourceQuotaCreatePayload Model
 */
const _KubernetesResourceQuotaCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    hard: {
      'requests.cpu': 0,
      'requests.memory': 0,
      'limits.cpu': 0,
      'limits.memory': 0,
    }
  }
});

export class KubernetesResourceQuotaCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesResourceQuotaCreatePayload)));
  }
}

/**
 * KubernetesResourceQuotaUpdatePayload Model
 */
const _KubernetesResourceQuotaUpdatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    hard: {
      'requests.cpu': 0,
      'requests.memory': 0,
      'limits.cpu': 0,
      'limits.memory': 0,
    }
  }
});

export class KubernetesResourceQuotaUpdatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesResourceQuotaUpdatePayload)));
  }
}
