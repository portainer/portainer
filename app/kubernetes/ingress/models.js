export function KubernetesIngress() {
  return {
    Name: '',
    Namespace: '',
    Annotations: {},
    Paths: [],
  };
}

// TODO: refactor
// rename this model to KubernetesIngressPath (and all it's references)
// as it's conceptually not an ingress rule (element of ingress.spec.rules)
// but a path (element of ingress.spec.rules[].paths)
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
