export function KubernetesIngress() {
  return {
    Name: '',
    Namespace: '',
    Rules: [],
    IngressClassName: '',
  };
}

export function KubernetesIngressRule() {
  return {
    ParentIngressName: '',
    ServiceName: '',
    Host: '',
    IP: '',
    Port: '',
    Path: '',
  };
}
