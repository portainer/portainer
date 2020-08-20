export const KubernetesIngressClassAnnotation = 'kubernetes.io/ingress.class';

// keys must match KubernetesIngressClassTypes values to map them quickly using the ingress type
// KubernetesIngressClassRewriteTargetAnnotations[KubernetesIngressClassTypes.NGINX] for example
export const KubernetesIngressClassRewriteTargetAnnotations = Object.freeze({
  nginx: { 'nginx.ingress.kubernetes.io/rewrite-target': '/' },
  traefik: { 'traefik.ingress.kubernetes.io/rewrite-target': '/' },
});

export const KubernetesIngressClassTypes = Object.freeze({
  NGINX: 'nginx',
  TRAEFIK: 'traefik',
});
