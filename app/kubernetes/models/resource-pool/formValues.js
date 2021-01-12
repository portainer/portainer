export function KubernetesResourcePoolFormValues(defaults) {
  return {
    Name: '',
    MemoryLimit: defaults.MemoryLimit,
    CpuLimit: defaults.CpuLimit,
    HasQuota: false,
    IngressClasses: [], // KubernetesResourcePoolIngressClassFormValue
  };
}

/**
 * @param {KubernetesIngressClass} ingressClass
 */
export function KubernetesResourcePoolIngressClassFormValue(ingressClass) {
  return {
    Namespace: undefined, // will be filled inside ResourcePoolService.create
    IngressClass: ingressClass,
    RewriteTarget: false,
    Annotations: [], // KubernetesResourcePoolIngressClassAnnotationFormValue
    Host: undefined,
    Selected: false,
    WasSelected: false,
    AdvancedConfig: false,
    Paths: [], // will be filled to save IngressClass.Paths inside ingressClassesToFormValues() on RP EDIT
  };
}

export function KubernetesResourcePoolIngressClassAnnotationFormValue() {
  return {
    Key: '',
    Value: '',
  };
}
