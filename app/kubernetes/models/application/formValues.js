import { KubernetesApplicationDeploymentTypes, KubernetesApplicationPublishingTypes, KubernetesApplicationDataAccessPolicies } from "./models";

/**
 * KubernetesApplicationFormValues Model
 */
const _KubernetesApplicationFormValues = Object.freeze({
  ResourcePool: {},
  Name: '',
  StackName: '',
  ApplicationOwner: '',
  Image: '',
  ReplicaCount: 1,
  Note: '',
  EnvironmentVariables: [], // KubernetesApplicationEnvironmentVariableFormValue list
  PersistedFolders: [], // KubernetesApplicationPersistedFolderFormValue list
  PublishedPorts: [], // KubernetesApplicationPublishedPortFormValue list
  MemoryLimit: 0,
  CpuLimit: 0,
  DeploymentType: KubernetesApplicationDeploymentTypes.REPLICATED,
  PublishingType: KubernetesApplicationPublishingTypes.INTERNAL,
  DataAccessPolicy: KubernetesApplicationDataAccessPolicies.SHARED,
  Configurations: [], // KubernetesApplicationConfigurationFormValue list
});

export class KubernetesApplicationFormValues {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationFormValues)));
  }
}

export const KubernetesApplicationConfigurationFormValueOverridenKeyTypes = Object.freeze({
  'ENVIRONMENT': 1,
  'FILESYSTEM': 2,
});

/**
 * KubernetesApplicationConfigurationFormValueOverridenKey Model
 */
const _KubernetesApplicationConfigurationFormValueOverridenKey = Object.freeze({
  Key: '',
  Path: '',
  Type: KubernetesApplicationConfigurationFormValueOverridenKeyTypes.ENVIRONMENT
});

export class KubernetesApplicationConfigurationFormValueOverridenKey {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationConfigurationFormValueOverridenKey)));
  }
}

/**
 * KubernetesApplicationConfigurationFormValue Model
 */
const _KubernetesApplicationConfigurationFormValue = Object.freeze({
  SelectedConfiguration: undefined,
  Overriden: false,
  OverridenKeys: [] // KubernetesApplicationConfigurationFormValueOverridenKey list
});

export class KubernetesApplicationConfigurationFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationConfigurationFormValue)));
  }
}

/**
 * KubernetesApplicationEnvironmentVariableFormValue Model
 */
const _KubernetesApplicationEnvironmentVariableFormValue = Object.freeze({
  Name: '',
  Value: '',
  IsSecret: false
});

export class KubernetesApplicationEnvironmentVariableFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationEnvironmentVariableFormValue)));
  }
}

/**
 * KubernetesApplicationPersistedFolderFormValue Model
 */
const _KubernetesApplicationPersistedFolderFormValue = Object.freeze({
  PersistentVolumeClaimName: '', // will be empty for new volumes (create/edit app) and filled for existing ones (edit)
  NeedsDeletion: false,
  ContainerPath: '',
  Size: '',
  SizeUnit: 'GB',
  StorageClass: {}
});

export class KubernetesApplicationPersistedFolderFormValue {
  constructor(storageClass) {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPersistedFolderFormValue)));
    this.StorageClass = storageClass;
  }
}

/**
 * KubernetesApplicationPublishedPortFormValue Model
 */
const _KubernetesApplicationPublishedPortFormValue = Object.freeze({
  ContainerPort: '',
  NodePort: '',
  LoadBalancerPort: '',
  Protocol: 'TCP'
});

export class KubernetesApplicationPublishedPortFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPublishedPortFormValue)));
  }
}
