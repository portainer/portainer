import { KubernetesCommonMetadataPayload } from "Kubernetes/models/common/payloads";

/**
 * KubernetesServiceCreatePayload Model
 */
const _KubernetesServiceCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    ports: [],
    selector: {
      app: ''
    },
    type: '',
    clusterIP: ''
  }
});

export class KubernetesServiceCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServiceCreatePayload)));
  }
}

/**
 * KubernetesServicePatchPayload Model
 */
const _KubernetesServicePatchPayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
});

export class KubernetesServicePatchPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesServicePatchPayload)));
  }
}
