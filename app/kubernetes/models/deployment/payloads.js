import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesDeploymentCreatePayload Model
 */
const _KubernetesDeploymentCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    replicas: 0,
    selector: {
      matchLabels: {
        app: '',
      },
    },
    strategy: {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxSurge: 0,
        maxUnavailable: '100%',
      },
    },
    template: {
      metadata: {
        labels: {
          app: '',
        },
      },
      spec: {
        affinity: {},
        containers: [
          {
            name: '',
            image: '',
            env: [],
            resources: {
              limits: {},
              requests: {},
            },
            volumeMounts: [],
          },
        ],
        volumes: [],
      },
    },
  },
});

export class KubernetesDeploymentCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDeploymentCreatePayload)));
  }
}
