export function KubernetesIngress() {
  return {
    Name: '',
    Namespace: '',
    Annotations: {},
    Host: undefined,
    PreviousHost: undefined, // only use for RP ingress host edit
    Paths: [],
    IngressClassName: '',
  };
}

// TODO: refactor @LP
// rename this model to KubernetesIngressPath (and all it's references)
// as it's conceptually not an ingress rule (element of ingress.spec.rules)
// but a path (element of ingress.spec.rules[].paths)
export function KubernetesIngressRule() {
  return {
    IngressName: '',
    ServiceName: '',
    Host: '',
    IP: '',
    Port: '',
    Path: '',
  };
}
