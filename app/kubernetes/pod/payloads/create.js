import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

export function createPayloadFactory() {
  return {
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
  };
}
