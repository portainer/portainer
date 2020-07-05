import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesStatefulSetCreatePayload Model
 */
const _KubernetesStatefulSetCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    replicas: 0,
    serviceName: '',
    selector: {
      matchLabels: {
        app: '',
      },
    },
    volumeClaimTemplates: [],
    updateStrategy: {
      type: 'RollingUpdate',
      rollingUpdate: {
        partition: 0,
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

export class KubernetesStatefulSetCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStatefulSetCreatePayload)));
  }
}
