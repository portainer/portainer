import { KubernetesCommonMetadataPayload } from "../common/payloads";

/**
 * KubernetesLimitRangeCreatePayload Model
 */
const _KubernetesLimitRangeCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    limits: [{
      default: {
        memory: '64Mi',
        cpu: '100m'
      },
      type: 'Container'
    }]
  }
});

export class KubernetesLimitRangeCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesLimitRangeCreatePayload)));
  }
}