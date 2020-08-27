import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

/**
 * KubernetesStorageClassCreatePayload Model
 */
const _KubernetesStorageClassCreatePayload = Object.freeze({
  metadata: new KubernetesCommonMetadataPayload(),
  provisioner: '',
  allowVolumeExpansion: false,
});

export class KubernetesStorageClassCreatePayload {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesStorageClassCreatePayload)));
  }
}
