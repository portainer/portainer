/**
 * KubernetesHorizontalPodAutoScaler Create Payload
 */
const _KubernetesHorizontalPodAutoScalerCreatePayload = Object.freeze({
  metadata: {
    namespace: '',
  },
  spec: {
    maxReplicas: 0,
    minReplicas: 0,
    scaleTargetRef: {
      apiVersion: '',
      kind: '',
      name: '',
    },
    targetCPUUtilizationPercentage: 0,
  },
});

export class KubernetesHorizontalPodAutoScaler {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesHorizontalPodAutoScalerCreatePayload)));
  }
}
