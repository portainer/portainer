import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesPersistentVolumeCreatePayload Model
 */
const _KubernetesPersistentVolumeCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    accessModes: ['ReadWriteOnce'],
    mountOptions: [],
    storageClassName: '',
  },
});

export class KubernetesPersistentVolumeCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPersistentVolumeCreatePayload)));
  }
}
