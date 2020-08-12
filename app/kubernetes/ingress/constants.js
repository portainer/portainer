export const KubernetesIngressClassAnnotation = 'kubernetes.io/ingress.class';
export const KubernetesIngressClassMandatoryAnnotations = Object.freeze({
  nginx: { 'nginx.ingress.kubernetes.io/rewrite-target': '/$1' },
});
