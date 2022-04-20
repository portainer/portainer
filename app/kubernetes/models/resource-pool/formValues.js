import { KubernetesNginxRewriteTargetAnnotations, KubernetesNginxUseregexAnnotations, KubernetesTraefikRewriteTargetAnnotations } from 'Kubernetes/ingress/constants';

export function KubernetesResourcePoolFormValues(defaults) {
  this.Name = '';
  this.MemoryLimit = defaults.MemoryLimit;
  this.CpuLimit = defaults.CpuLimit;
  this.HasQuota = false;
  this.IngressClasses = []; // KubernetesResourcePoolIngressClassFormValue
  this.Registries = []; // RegistryViewModel
  this.EndpointId = 0;
  this.IsSystem = false;
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

export function KubernetesResourcePoolNginxRewriteAnnotationFormValue() {
  return KubernetesNginxRewriteTargetAnnotations;
}

export function KubernetesResourcePoolNginxUseregexAnnotationFormValue() {
  return KubernetesNginxUseregexAnnotations;
}

export function KubernetesResourcePoolTraefikRewriteAnnotationFormValue() {
  return KubernetesTraefikRewriteTargetAnnotations;
}
