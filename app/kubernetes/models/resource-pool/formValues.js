export function KubernetesResourcePoolFormValues(defaults) {
  return {
    Name: '',
    MemoryLimit: defaults.MemoryLimit,
    CpuLimit: defaults.CpuLimit,
    HasQuota: false,
    IngressClasses: [], // KubernetesResourcePoolIngressClassFormValue
    StorageClasses: [], // KubernetesResourcePoolStorageClassFormValue
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

export function KubernetesResourcePoolStorageClassFormValue(name) {
  return {
    Name: name,
    Size: 0,
    SizeUnit: 'GB',
    Selected: false,
  };
}
