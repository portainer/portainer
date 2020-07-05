import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesPersistentVolumClaimCreatePayload Model
 */
const _KubernetesPersistentVolumClaimCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: '',
      },
    },
    storageClassName: '',
  },
});

export class KubernetesPersistentVolumClaimCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolumClaimCreatePayload)));
  }
}
