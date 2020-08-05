export function KubernetesResourcePoolFormValues(defaults) {
  return {
    MemoryLimit: defaults.MemoryLimit,
    CpuLimit: defaults.CpuLimit,
    HasQuota: true,
    UseIngress: false,
    IngressClasses: [],
  };
}

export function KubernetesResourcePoolIngressClassFormValue(ingressClass) {
  return {
    Name: ingressClass ? ingressClass : '',
    Selected: false,
  };
}
