import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

export function KubernetesIngressCreatePayload() {
  return {
    metadata: new KubernetesCommonMetadataPayload(),
    spec: {
      rules: [],
    },
  };
}

export function KubernetesIngressRuleCreatePayload() {
  return {
    host: '',
    http: {
      paths: [],
    },
  };
}

export function KubernetesIngressRulePathCreatePayload() {
  return {
    backend: {
      serviceName: '',
      servicePort: 0,
    },
    path: '',
  };
}
