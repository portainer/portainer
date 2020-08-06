export function KubernetesResourcePoolFormValues(defaults) {
  return {
    MemoryLimit: defaults.MemoryLimit,
    CpuLimit: defaults.CpuLimit,
    HasQuota: true,
    UseIngress: false,
    IngressClasses: [],
  };
}

export function KubernetesResourcePoolIngressClassFormValue(ingressClassName) {
  return {
    Name: ingressClassName,
    IngressClassName: ingressClassName,
    Selected: false,
    WasSelected: false,
  };
}
