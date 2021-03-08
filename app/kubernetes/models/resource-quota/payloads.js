import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';
import {
  KubernetesPortainerResourceQuotaCPURequest,
  KubernetesPortainerResourceQuotaMemoryRequest,
  KubernetesPortainerResourceQuotaCPULimit,
  KubernetesPortainerResourceQuotaMemoryLimit,
} from './models';

export function KubernetesResourceQuotaCreatePayload() {
  return {
    metadata: new KubernetesCommonMetadataPayload(),
    spec: {
      hard: {
        [KubernetesPortainerResourceQuotaCPURequest]: 0,
        [KubernetesPortainerResourceQuotaMemoryRequest]: 0,
        [KubernetesPortainerResourceQuotaCPULimit]: 0,
        [KubernetesPortainerResourceQuotaMemoryLimit]: 0,
      },
    },
  };
}
