/**
 * KubernetesHorizontalPodAutoScaler Create Payload Model
 */
const _KubernetesHorizontalPodAutoScalerCreatePayload = Object.freeze({
  metadata: {
    namespace: '',
    name: '',
  },
  spec: {
    maxReplicas: 0,
    minReplicas: 0,
    targetCPUUtilizationPercentage: 0,
    scaleTargetRef: {
      kind: '',
      name: '',
    },
  },
});

export class KubernetesHorizontalPodAutoScalerCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesHorizontalPodAutoScalerCreatePayload)));
  }
}

/**
 * KubernetesHorizontalPodAutoScaler Create Payload Model for v2beta2
 * Include support of memory usage
 */

// const _KubernetesHorizontalPodAutoScalerCreatePayload = Object.freeze({
//   metadata: {
//     namespace: '',
//     name: ''
//   },
//   spec: {
//     maxReplicas: 0,
//     minReplicas: 0,
//     targetCPUUtilizationPercentage: 0,
//     scaleTargetRef: {
//       kind: '',
//       name: ''
//     },
//     metrics: []
//   }
// });

// export class KubernetesHorizontalPodAutoScalerCreatePayload {
//   constructor() {
//     Object.assign(this, JSON.parse(JSON.stringify(_KubernetesHorizontalPodAutoScalerCreatePayload)));
//   }
// }

// const _KubernetesHorizontalPodAutoScalerCPUMetric = Object.freeze({
//   type: 'Resource',
//   resource: {
//     name: 'cpu',
//     target: {
//       type: 'Utilization',
//       averageUtilization: 0
//     }
//   }
// });

// export class KubernetesHorizontalPodAutoScalerCPUMetric {
//   constructor() {
//     Object.assign(this, JSON.parse(JSON.stringify(_KubernetesHorizontalPodAutoScalerCPUMetric)));
//   }
// }

// const _KubernetesHorizontalPodAutoScalerMemoryMetric = Object.freeze({
//   type: 'Resource',
//   resource: {
//     name: 'memory',
//     target: {
//       type: 'AverageValue',
//       averageValue: ''
//     }
//   }
// });

// export class KubernetesHorizontalPodAutoScalerMemoryMetric {
//   constructor() {
//     Object.assign(this, JSON.parse(JSON.stringify(_KubernetesHorizontalPodAutoScalerMemoryMetric)));
//   }
// }
