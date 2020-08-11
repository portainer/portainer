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
 * @param {string} ingressClassName
 */
export function KubernetesResourcePoolIngressClassFormValue(ingressClassName) {
  return {
    Name: ingressClassName,
    IngressClassName: ingressClassName,
    Host: undefined,
    Selected: false,
    WasSelected: false,
    Namespace: undefined, // will be filled inside ResourcePoolService.create
  };
}
