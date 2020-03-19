export const KubernetesApplicationDeploymentTypes = Object.freeze({
  'REPLICATED': 1,
  'GLOBAL': 2
});

export const KubernetesApplicationDataAccessPolicies = Object.freeze({
  'SHARED': 1,
  'ISOLATED': 2
});

export const KubernetesApplicationTypes = Object.freeze({
  'DEPLOYMENT': 1,
  'DAEMONSET': 2,
  'STATEFULSET': 3
});

export const KubernetesApplicationPublishingTypes = Object.freeze({
  'INTERNAL': 1,
  'CLUSTER': 2,
  'LOADBALANCER': 3
});

export const KubernetesApplicationQuotaDefaults = {
  CpuLimit: 0.10,
  MemoryLimit: 64 // MB
};

export const KubernetesPortainerApplicationStackNameLabel = 'io.portainer.kubernetes.application.stack';

export const KubernetesPortainerApplicationNameLabel = 'io.portainer.kubernetes.application.name';

export const KubernetesPortainerApplicationOwnerLabel = 'io.portainer.kubernetes.application.owner';

/**
 * KubernetesApplication Model
 */
const _KubernetesApplication = Object.freeze({
  Id: '',
  Name: '',
  StackName: '',
  ApplicationOwner: '',
  ResourcePool: '',
  Image: '',
  CreatedAt: 0,
  Pods: [],
  Limits: [],
  ServiceType: '',
  ServiceId: '',
  PublishedPorts: [],
  Volumes: [],
  DeploymentType: 'Unknown',
  DataAccessPolicy: 'Unknown',
  ApplicationType: 'Unknown',
  RunningPodsCount: 0,
  TotalPodsCount: 0,
  Yaml: ''
});

export class KubernetesApplication {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplication)));
  }
}
