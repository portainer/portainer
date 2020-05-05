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

export const KubernetesPortainerApplicationNote = 'io.portainer.kubernetes.application.note';

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
  CreationDate: 0,
  Pods: [],
  Limits: [],
  ServiceType: '',
  ServiceId: '',
  HeadlessServiceName: undefined, // only used for StatefulSet
  PublishedPorts: [],
  Volumes: [],
  Env: [],
  PersistedFolders: [], // KubernetesApplicationPersistedFolder list
  ConfigurationVolumes: [], // KubernetesApplicationConfigurationVolume list
  DeploymentType: 'Unknown',
  DataAccessPolicy: 'Unknown',
  ApplicationType: 'Unknown',
  RunningPodsCount: 0,
  TotalPodsCount: 0,
  Yaml: '',
  Note: ''
});

export class KubernetesApplication {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplication)));
  }
}

/**
 * _KubernetesApplicationPersistedFolder Model
 */
const _KubernetesApplicationPersistedFolder = Object.freeze({
  mountPath: '',
  persistentVolumeClaimName: '',
  hostPath: ''
});

export class KubernetesApplicationPersistedFolder {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPersistedFolder)));
  }
}

/**
 * KubernetesApplicationConfigurationVolume Model
 */
const _KubernetesApplicationConfigurationVolume = Object.freeze({
  mountPath: '',
  configurationKey: '',
  configurationName: ''
});

export class KubernetesApplicationConfigurationVolume {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationConfigurationVolume)));
  }
}
