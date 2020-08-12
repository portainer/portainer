export const KubernetesApplicationDeploymentTypes = Object.freeze({
  REPLICATED: 1,
  GLOBAL: 2,
});

export const KubernetesApplicationDataAccessPolicies = Object.freeze({
  SHARED: 1,
  ISOLATED: 2,
});

export const KubernetesApplicationTypes = Object.freeze({
  DEPLOYMENT: 1,
  DAEMONSET: 2,
  STATEFULSET: 3,
});

export const KubernetesApplicationTypeStrings = Object.freeze({
  DEPLOYMENT: 'Deployment',
  DAEMONSET: 'DaemonSet',
  STATEFULSET: 'StatefulSet',
});

export const KubernetesApplicationPublishingTypes = Object.freeze({
  INTERNAL: 1,
  CLUSTER: 2,
  LOAD_BALANCER: 3,
  INGRESS: 4,
});

export const KubernetesApplicationQuotaDefaults = {
  CpuLimit: 0.1,
  MemoryLimit: 64, // MB
};

export const KubernetesPortainerApplicationStackNameLabel = 'io.portainer.kubernetes.application.stack';

export const KubernetesPortainerApplicationNameLabel = 'io.portainer.kubernetes.application.name';

export const KubernetesPortainerApplicationOwnerLabel = 'io.portainer.kubernetes.application.owner';

export const KubernetesPortainerApplicationNote = 'io.portainer.kubernetes.application.note';
