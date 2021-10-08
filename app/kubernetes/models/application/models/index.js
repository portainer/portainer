export * from './constants';

/**
 * KubernetesApplication Model (Composite)
 */
const _KubernetesApplication = Object.freeze({
  Id: '',
  Name: '',
  StackName: '',
  StackId: '',
  ApplicationKind: '',
  ApplicationOwner: '',
  ApplicationName: '',
  ResourcePool: '',
  Image: '',
  CreationDate: 0,
  Pods: [],
  Containers: [],
  Metadata: {},
  Limits: {},
  ServiceType: '',
  ServiceId: '',
  ServiceName: '',
  HeadlessServiceName: undefined, // only used for StatefulSet
  LoadBalancerIPAddress: undefined, // only filled when bound service is LoadBalancer and state is available
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
  Note: '',
  Revisions: undefined,
  CurrentRevision: undefined,
  Raw: undefined, // only filled when inspecting app details / create / edit view (never filled in multiple-apps views)
  AutoScaler: undefined, // only filled if the application has an HorizontalPodAutoScaler bound to it
});

export class KubernetesApplication {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplication)));
  }
}

/**
 * HelmApplication Model (Composite)
 */
export class HelmApplication {
  constructor() {
    this.Id = '';
    this.Name = '';
    this.KubernetesApplications = [];
    this.ApplicationOwner = '';
    this.CreationDate = 0;
    this.ApplicationType = 'Unknown';
    this.Status = '';
    this.StackName = '-';
    this.ResourcePool = '-';
    this.Image = '-';
    this.PublishedPorts = [];
  }
}

/**
 * KubernetesApplicationPersistedFolder Model
 */
const _KubernetesApplicationPersistedFolder = Object.freeze({
  MountPath: '',
  PersistentVolumeClaimName: '',
  HostPath: '',
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
  fileMountPath: '',
  rootMountPath: '',
  configurationKey: '',
  configurationName: '',
});

export class KubernetesApplicationConfigurationVolume {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationConfigurationVolume)));
  }
}

/**
 * KubernetesApplicationPort Model
 */
const _KubernetesApplicationPort = Object.freeze({
  IngressRules: [], // KubernetesIngressRule[]
  NodePort: 0,
  TargetPort: 0,
  Port: 0,
  Protocol: '',
});

export class KubernetesApplicationPort {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPort)));
  }
}

export const KubernetesDeploymentTypes = Object.freeze({
  GIT: 'git',
  CONTENT: 'content',
  APPLICATION_FORM: 'application form',
  URL: 'url',
});
