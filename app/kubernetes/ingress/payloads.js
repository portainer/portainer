import { KubernetesCommonMetadataPayload } from 'Kubernetes/models/common/payloads';

export function KubernetesIngressCreatePayload() {
  return {
    metadata: new KubernetesCommonMetadataPayload(),
    spec: {
      ingressClassName: '',
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
    path: '',
    pathType: 'ImplementationSpecific',
    backend: {
      service: {
        name: '',
        port: {
          number: 0,
        },
      },
    },
  };
}
