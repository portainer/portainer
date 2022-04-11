export const KubernetesIngressClassAnnotation = 'kubernetes.io/ingress.class';

// keys must match KubernetesIngressClassTypes values to map them quickly using the ingress type
// KubernetesIngressClassRewriteTargetAnnotations[KubernetesIngressClassTypes.NGINX] for example
export const KubernetesNginxRewriteTargetAnnotations = Object.freeze({
  Key: 'nginx.ingress.kubernetes.io/rewrite-target',
  Value: '/',
});

export const KubernetesTraefikRewriteTargetAnnotations = Object.freeze({
  Key: 'traefik.ingress.kubernetes.io/rewrite-target',
  Value: '/',
});

export const KubernetesNginxUseregexAnnotations = Object.freeze({
  Key: 'nginx.ingress.kubernetes.io/use-regex',
  Value: 'true',
});

export const KubernetesIngressClassTypes = Object.freeze({
  NGINX: 'nginx',
  TRAEFIK: 'traefik',
});

export const PortainerIngressClassTypes = 'ingress.portainer.io/ingress-type';
