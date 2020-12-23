import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesPVCreatePayload Model
 */
const _KubernetesPVCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  spec: {
    accessModes: ['ReadWriteOnce'],
    mountOptions: [],
    storageClassName: '',
  },
});

export class KubernetesPVCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesPVCreatePayload)));
  }
}
