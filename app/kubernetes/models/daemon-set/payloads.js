import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesDaemonSetCreatePayload Model
 */
const _KubernetesDaemonSetCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    replicas: 0,
    selector: {
      matchLabels: {
        app: '',
      },
    },
    updateStrategy: {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: 1,
      },
    },
    template: {
      metadata: {
        labels: {
          app: '',
        },
      },
      spec: {
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

export class KubernetesDaemonSetCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDaemonSetCreatePayload)));
  }
}
