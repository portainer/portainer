/**
 * KubernetesNode Create Payload Model
 * Note: The current payload is here just to create patch payload.
 */
const _KubernetesNodeCreatePayload = Object.freeze({
  metadata: {
    name: '',
    labels: {},
  },
  spec: {
    taints: undefined,
  },
});

export class KubernetesNodeCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNodeCreatePayload)));
  }
}

const _KubernetesNodeTaintPayload = Object.freeze({
  key: '',
  value: '',
  effect: '',
});

export class KubernetesNodeTaintPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesNodeTaintPayload)));
  }
}
