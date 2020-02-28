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

export const KubernetesApplicationStackAnnotationKey = 'io.portainer.kubernetes.stack';

/**
 * KubernetesApplication Model
 */
const _KubernetesApplication = Object.freeze({
  Id: '',
  Name: '',
  Stack: '',
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

export function KubernetesApplicationFormValues() {
  this.ResourcePool = '';
  this.Name = '';
  this.StackName = '';
  this.Image = '';
  this.ReplicaCount = 1;
  this.EnvironmentVariables = [];
  this.PersistedFolders = [];
  this.PublishedPorts = [];
  this.MemoryLimit = 0;
  this.CpuLimit = 0;
  this.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
  this.PublishingType = KubernetesApplicationPublishingTypes.INTERNAL;
}

export function KubernetesApplicationEnvironmentVariableFormValue() {
  const envVar = {
    Name: '',
    Value: '',
    IsSecret: false
  };

  return envVar;
}

export function KubernetesApplicationPersistedFolderFormValue(storageClass) {
  const persistedFolder = {
    ContainerPath: '',
    Size: '',
    StorageClass: storageClass,
  };

  return persistedFolder;
}

export function KubernetesApplicationPublishedPortFormValue() {
  const publishedPort = {
    ContainerPort: '',
    NodePort: '',
    LoadBalancerPort: '',
    Protocol: 'TCP'
  };

  return publishedPort;
}