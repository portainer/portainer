export function KubernetesIngress() {
  return {
    Name: '',
    Namespace: '',
    Rules: [],
    IngressClass: '',
  };
}

export function KubernetesIngressRule() {
  return {
    ServiceName: '',
    Host: '',
    IP: '',
    Port: '',
    Path: '',
  };
}
