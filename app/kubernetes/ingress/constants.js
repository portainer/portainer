export const KubernetesIngressClassAnnotation = 'kubernetes.io/ingress.class';

// keys must match KubernetesIngressClassTypes values to map them quickly using the ingress type
// KubernetesIngressClassRewriteTargetAnnotations[KubernetesIngressClassTypes.NGINX] for example

export const KubernetesNginxRewriteTargetAnnotations = {
  Key: 'nginx.ingress.kubernetes.io/rewrite-target',
  Value: '/$1',
};

export const KubernetesTraefikRewriteTargetAnnotations = {
  Key: 'traefik.ingress.kubernetes.io/rewrite-target',
  Value: '/$1',
};

export const KubernetesNginxUseregexAnnotations = {
  Key: 'nginx.ingress.kubernetes.io/use-regex',
  Value: 'true',
};

export const KubernetesIngressClassTypes = Object.freeze({
  NGINX: 'nginx',
  TRAEFIK: 'traefik',
});

export const PortainerIngressClassTypes = 'ingress.portainer.io/ingress-type';
