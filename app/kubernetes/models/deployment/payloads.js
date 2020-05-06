import { KubernetesCommonMetadataPayload } from "Kubernetes/models/common/payloads";

/**
 * KubernetesDeploymentCreatePayload Model
 */
 const _KubernetesDeploymentCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    replicas: 0,
    selector: {
      matchLabels: {
        app: ''
      }
    },
    template: {
      metadata: {
        labels: {
          app: ''
        }
      },
      spec: {
        containers: [
          {
            name: '',
            image: '',
            env: [],
            resources: {
              limits: {},
              requests: {}
            },
            volumeMounts: []
          }
        ],
        volumes: []
      }
    }
  }
});

export class KubernetesDeploymentCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDeploymentCreatePayload)));
  }
}
