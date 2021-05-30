import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesPersistentVolumeCreatePayload Model
 */
export function KubernetesPersistentVolumeCreatePayload() {
  return {
    metadata: new KubernetesCommonMetadataPayload(),
    spec: {
      accessModes: ['ReadWriteOnce'],
      capacity: {
        storage: '',
      },
      nfs: {
        path: '',
        server: '',
      },
    },
  };
}
