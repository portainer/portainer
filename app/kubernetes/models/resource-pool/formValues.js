export function KubernetesResourcePoolFormValues(defaults) {
  return {
    MemoryLimit: defaults.MemoryLimit,
    CpuLimit: defaults.CpuLimit,
    HasQuota: true,
    UseIngress: false,
    IngressClasses: [], // KubernetesResourcePoolIngressClassFormValue
  };
}

/**
 * @param {string} ingressName
 */
export function KubernetesResourcePoolIngressClassFormValue(ingressName) {
  return {
    Name: ingressName,
    Selected: false,
    WasSelected: false,
    Namespace: undefined, // will be filled inside ResourcePoolService.create
  };
}
