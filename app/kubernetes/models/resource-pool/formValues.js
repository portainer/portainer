export function KubernetesResourcePoolFormValues(defaults) {
  this.Name = '';
  this.MemoryLimit = defaults.MemoryLimit;
  this.CpuLimit = defaults.CpuLimit;
  this.LoadBalancers = defaults.LoadBalancers;
  this.UseLoadBalancersQuota = false;
  this.HasQuota = false;
  this.IngressClasses = []; // KubernetesResourcePoolIngressClassFormValue
  this.StorageClasses = []; // KubernetesResourcePoolStorageClassFormValue
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
    Hosts: [],
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

export function KubernetesResourcePoolIngressClassHostFormValue() {
  return {
    Host: '',
    PreviousHost: '',
    NeedsDeletion: false,
    IsNew: true,
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
