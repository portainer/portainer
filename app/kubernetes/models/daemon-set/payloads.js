import { KubernetesCommonMetadataPayload } from "Kubernetes/models/common/payloads";

/**
 * KubernetesDaemonSetCreatePayload Model
 */
 const _KubernetesDaemonSetCreatePayload = Object.freeze({
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

export class KubernetesDaemonSetCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDaemonSetCreatePayload)));
  }
}

/**
 * KubernetesDaemonSetPatchPayload Model
 */
const _KubernetesDaemonSetPatchPayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
});

export class KubernetesDaemonSetPatchPayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesDaemonSetPatchPayload)));
  }
}
